#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, vec, log, Env, Address, Symbol, Vec, String, BytesN, Map, U32};

// ============================================================================
// TYPES & STRUCTURES
// ============================================================================

/// Represents a single asset in a conversion path
#[derive(Clone, Debug, PartialEq, Eq)]
#[contracttype]
pub struct Asset {
    pub asset_code: BytesN<12>,
    pub issuer: Address,
}

/// Represents a conversion path: Source -> [Intermediaries] -> Destination
#[derive(Clone, Debug)]
#[contracttype]
pub struct ConversionPath {
    pub path_assets: Vec<Asset>,      // Assets to trade through
    pub estimated_output: i128,        // Estimated output amount
    pub total_fees_percent: u32,       // Total fees as percentage (e.g., 150 = 1.5%)
    pub liquidity_score: u32,          // Score 0-100 for path reliability
}

/// Represents execution conditions for automatic path payment
#[derive(Clone, Debug)]
#[contracttype]
pub struct ExecutionCondition {
    pub min_exchange_rate: i128,      // Minimum acceptable rate (scaled)
    pub max_fee_percent: u32,          // Maximum acceptable fee
    pub min_liquidity_depth: i128,     // Minimum liquidity pool size
    pub execution_deadline: u64,       // Unix timestamp deadline
}

/// Core payment routing struct
#[derive(Clone, Debug)]
#[contracttype]
pub struct PaymentRoute {
    pub user: Address,
    pub source_amount: i128,
    pub source_asset: Asset,
    pub destination_asset: Asset,
    pub recipient: Address,
    pub optimal_path: ConversionPath,
    pub conditions: ExecutionCondition,
    pub executed: bool,
    pub execution_txn_hash: Option<String>,
}

// ============================================================================
// CONTRACT INTERFACE
// ============================================================================

#[contract]
pub struct OrbitPathContract;

#[contractimpl]
impl OrbitPathContract {
    // ========================================================================
    // 1. PATH DISCOVERY & EVALUATION
    // ========================================================================

    /// Evaluates a conversion path and returns cost metrics
    /// 
    /// # Arguments
    /// * `env` - Soroban environment
    /// * `source_asset` - Asset user is sending
    /// * `destination_asset` - Asset user wants to receive
    /// * `send_amount` - Amount of source asset to send
    /// * `path_assets` - Intermediate assets in the conversion path
    ///
    /// # Returns
    /// `ConversionPath` with estimated output and fee breakdown
    pub fn evaluate_path(
        env: Env,
        source_asset: Asset,
        destination_asset: Asset,
        send_amount: i128,
        path_assets: Vec<Asset>,
    ) -> ConversionPath {
        env.soroban_sdk::log!("[OrbitPath] Evaluating conversion path");

        // Validate inputs
        if send_amount <= 0 {
            panic!("Send amount must be positive");
        }

        if path_assets.len() > 5 {
            panic!("Path length exceeds maximum (5 intermediaries)");
        }

        // Build full path: source -> intermediaries -> destination
        let mut full_path = vec![&env];
        full_path.push_back(source_asset.clone());
        
        for asset in path_assets.iter() {
            full_path.push_back(asset.clone());
        }
        
        full_path.push_back(destination_asset.clone());

        // Simulate path payment (in production, call Stellar path_payment RPC)
        let (estimated_output, total_fees_percent, liquidity_score) =
            Self::simulate_path_execution(
                &env,
                send_amount,
                &full_path,
            );

        log!(&env, "[OrbitPath] Path evaluation complete: output={}, fees={}%", estimated_output, total_fees_percent);

        ConversionPath {
            path_assets,
            estimated_output,
            total_fees_percent,
            liquidity_score,
        }
    }

    /// Compares multiple paths and returns the optimal one
    ///
    /// # Arguments
    /// * `env` - Soroban environment
    /// * `paths` - Vector of potential conversion paths
    /// * `min_liquidity_requirement` - Minimum liquidity depth acceptable
    ///
    /// # Returns
    /// Index of optimal path and its metrics
    pub fn select_optimal_path(
        env: Env,
        paths: Vec<ConversionPath>,
        min_liquidity_requirement: i128,
    ) -> (u32, ConversionPath) {
        env.soroban_sdk::log!("[OrbitPath] Selecting optimal path from {} candidates", paths.len());

        if paths.is_empty() {
            panic!("No paths provided for evaluation");
        }

        let mut best_idx: u32 = 0;
        let mut best_path = paths.get(0).unwrap();
        let mut best_score = Self::calculate_path_score(&best_path, min_liquidity_requirement);

        for i in 1..paths.len() {
            let current_path = paths.get(i).unwrap();
            let current_score = Self::calculate_path_score(&current_path, min_liquidity_requirement);

            // Lower fees and higher liquidity = better score
            if current_score > best_score {
                best_idx = i as u32;
                best_path = current_path;
                best_score = current_score;
            }
        }

        log!(&env, "[OrbitPath] Optimal path selected (index={}): fees={}%, liquidity_score={}", best_idx, best_path.total_fees_percent, best_path.liquidity_score);

        (best_idx, best_path)
    }

    // ========================================================================
    // 2. ROUTE STORAGE & MANAGEMENT
    // ========================================================================

    /// Stores a payment route for later execution
    ///
    /// # Arguments
    /// * `env` - Soroban environment
    /// * `route_id` - Unique identifier for this route
    /// * `route` - PaymentRoute to store
    pub fn store_route(
        env: Env,
        route_id: Symbol,
        route: PaymentRoute,
    ) {
        env.soroban_sdk::log!("[OrbitPath] Storing route: {}", route_id);

        // Store route in persistent contract storage
        env.storage().persistent().set(&route_id, &route);

        env.events().publish(("route_stored", route_id), route.source_amount);
    }

    /// Retrieves a previously stored payment route
    ///
    /// # Arguments
    /// * `env` - Soroban environment
    /// * `route_id` - Identifier of route to retrieve
    ///
    /// # Returns
    /// `PaymentRoute` if found
    pub fn get_route(
        env: Env,
        route_id: Symbol,
    ) -> Option<PaymentRoute> {
        env.soroban_sdk::log!("[OrbitPath] Retrieving route: {}", route_id);
        
        env.storage().persistent().get(&route_id)
    }

    // ========================================================================
    // 3. EXECUTION & TRIGGER LOGIC
    // ========================================================================

    /// Evaluates whether conditions are met to execute a payment
    ///
    /// # Arguments
    /// * `env` - Soroban environment
    /// * `route` - PaymentRoute to evaluate
    /// * `current_rate` - Current market exchange rate (scaled)
    /// * `current_liquidity` - Current liquidity depth in pools
    ///
    /// # Returns
    /// `true` if all conditions are met for execution
    pub fn should_execute(
        env: Env,
        route: PaymentRoute,
        current_rate: i128,
        current_liquidity: i128,
    ) -> bool {
        let current_time = env.ledger().timestamp();
        let conditions = &route.conditions;

        // Check 1: Exchange rate acceptable
        if current_rate < conditions.min_exchange_rate {
            log!(&env, "[OrbitPath] Rate check FAILED: {} < {}", current_rate, conditions.min_exchange_rate);
            return false;
        }

        // Check 2: Fee percentage acceptable
        if route.optimal_path.total_fees_percent > conditions.max_fee_percent {
            log!(&env, "[OrbitPath] Fee check FAILED: {}% > {}%", route.optimal_path.total_fees_percent, conditions.max_fee_percent);
            return false;
        }

        // Check 3: Sufficient liquidity
        if current_liquidity < conditions.min_liquidity_depth {
            log!(&env, "[OrbitPath] Liquidity check FAILED: {} < {}", current_liquidity, conditions.min_liquidity_depth);
            return false;
        }

        // Check 4: Execution deadline not passed
        if current_time > conditions.execution_deadline {
            log!(&env, "[OrbitPath] Deadline check FAILED: {} > {}", current_time, conditions.execution_deadline);
            return false;
        }

        log!(&env, "[OrbitPath] All execution conditions MET ✓");
        true
    }

    /// Triggers automated execution of a payment route
    ///
    /// # Arguments
    /// * `env` - Soroban environment
    /// * `route_id` - Identifier of route to execute
    /// * `current_rate` - Current exchange rate
    /// * `current_liquidity` - Current pool liquidity
    ///
    /// # Returns
    /// Transaction hash of executed payment
    pub fn execute_payment(
        env: Env,
        route_id: Symbol,
        current_rate: i128,
        current_liquidity: i128,
    ) -> String {
        env.soroban_sdk::log!("[OrbitPath] Executing payment: {}", route_id);

        // Retrieve stored route
        let mut route: PaymentRoute = env.storage()
            .persistent()
            .get(&route_id)
            .expect("Route not found");

        if route.executed {
            panic!("Route already executed");
        }

        // Verify conditions
        if !Self::should_execute(env.clone(), route.clone(), current_rate, current_liquidity) {
            panic!("Execution conditions not met");
        }

        // In production, this would:
        // 1. Call Stellar PathPaymentStrictReceive/Send
        // 2. Handle the transaction submission
        // 3. Return the transaction hash
        
        // Simulated execution
        let txn_hash = String::from_bytes(
            &env,
            &BytesN::<32>::random(&env).to_bytes()
        );

        // Update route as executed
        route.executed = true;
        route.execution_txn_hash = Some(txn_hash.clone());
        env.storage().persistent().set(&route_id, &route);

        env.events().publish(
            ("payment_executed", route_id),
            (route.source_amount, route.optimal_path.estimated_output),
        );

        log!(&env, "[OrbitPath] Payment executed successfully: {}", txn_hash);

        txn_hash
    }

    // ========================================================================
    // 4. MONITORING & ANALYTICS
    // ========================================================================

    /// Calculates total savings vs traditional transfer methods
    ///
    /// # Arguments
    /// * `env` - Soroban environment
    /// * `source_amount` - Original send amount
    /// * `estimated_output` - Amount recipient will receive via OrbitPath
    /// * `traditional_fees_percent` - Historical fee % (e.g., 3% for SWIFT)
    ///
    /// # Returns
    /// Tuple: (savings_amount, savings_percent)
    pub fn calculate_savings(
        env: Env,
        source_amount: i128,
        estimated_output: i128,
        traditional_fees_percent: u32,
    ) -> (i128, u32) {
        let traditional_output = source_amount * (100_u32.saturating_sub(traditional_fees_percent) as i128) / 100;
        let savings = traditional_output.saturating_sub(estimated_output);
        let savings_percent = if source_amount > 0 {
            (savings * 100 / source_amount) as u32
        } else {
            0
        };

        log!(&env, "[OrbitPath] Savings calculation: {} units ({:.2}%)", savings, savings_percent);

        (savings, savings_percent)
    }

    /// Retrieves execution history for analytics
    ///
    /// # Arguments
    /// * `env` - Soroban environment
    /// * `user` - Address of user to get history for
    /// * `limit` - Maximum number of recent transactions to retrieve
    ///
    /// # Returns
    /// Vector of user's recent payment routes
    pub fn get_user_history(
        env: Env,
        user: Address,
        limit: u32,
    ) -> Vec<PaymentRoute> {
        env.soroban_sdk::log!("[OrbitPath] Retrieving history for user: {}", user);

        // In production, this would query a database or event log
        // For now, return empty vector as placeholder
        vec![&env]
    }

    // ========================================================================
    // 5. HELPER FUNCTIONS
    // ========================================================================

    /// Simulates path payment execution and returns output amount and fees
    /// 
    /// In production, this would call Stellar APIs or use oracles
    fn simulate_path_execution(
        env: &Env,
        send_amount: i128,
        path: &Vec<Asset>,
    ) -> (i128, u32, u32) {
        // Simulate fees: 0.5% per hop
        let num_hops = if path.len() > 1 { path.len() - 1 } else { 1 };
        let base_fee_percent = (50u32).saturating_mul(num_hops as u32); // 0.5% per hop

        let fees_amount = send_amount * (base_fee_percent as i128) / 10_000;
        let estimated_output = send_amount.saturating_sub(fees_amount);

        // Liquidity score: higher = better
        // In production, would check actual pool reserves
        let liquidity_score = 85u32;

        env.soroban_sdk::log!("[OrbitPath] Simulated execution: {} -> {} ({}% fees)", send_amount, estimated_output, base_fee_percent / 100);

        (estimated_output, base_fee_percent / 100, liquidity_score)
    }

    /// Calculates a composite score for path comparison
    /// Higher score = better path
    /// 
    /// Score = (100 - fees_percent) + (liquidity_score * 0.5)
    fn calculate_path_score(
        path: &ConversionPath,
        min_liquidity_requirement: i128,
    ) -> i128 {
        if path.liquidity_score == 0 {
            return 0;
        }

        let fee_score = 100i128.saturating_sub(path.total_fees_percent as i128);
        let liquidity_score = (path.liquidity_score as i128).saturating_mul(50) / 100;

        fee_score.saturating_add(liquidity_score)
    }
}

// ============================================================================
// TESTS (Compile with: cargo test --target wasm32-unknown-unknown)
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::Env;

    #[test]
    fn test_path_evaluation() {
        let env = Env::default();

        let source_asset = Asset {
            asset_code: BytesN::from_array(&env, &[
                88, 76, 77, 0, 0, 0, 0, 0, 0, 0, 0, 0, // "XLM"
            ]),
            issuer: Address::from_contract_id(&env, &[0; 32]),
        };

        let destination_asset = Asset {
            asset_code: BytesN::from_array(&env, &[
                85, 83, 68, 67, 0, 0, 0, 0, 0, 0, 0, 0, // "USDC"
            ]),
            issuer: Address::from_contract_id(&env, &[1; 32]),
        };

        let path = vec![&env];

        let result = OrbitPathContract::evaluate_path(
            env,
            source_asset,
            destination_asset,
            1_000_000,
            path,
        );

        assert!(result.estimated_output > 0);
    }
}
