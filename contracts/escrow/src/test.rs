#![cfg(test)]
use crate::{EscrowContract, EscrowContractClient, EscrowStatus, Escrow};
use soroban_sdk::{Env, Address, token};
use soroban_sdk::testutils::Address as _;
use stellarpay_reputation::{ReputationContract, ReputationContractClient};


#[test]
fn test_create_escrow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let recipient = Address::generate(&env);

    // Deploy token contract
    let token_address = env.register_stellar_asset_contract(admin.clone());
    let token_client = token::Client::new(&env, &token_address);
    let token_admin = token::StellarAssetClient::new(&env, &token_address);

    // Mint token for creator
    token_admin.mint(&creator, &1000);
    assert_eq!(token_client.balance(&creator), 1000);

    // Deploy Escrow Contract
    let escrow_id = env.register(EscrowContract, ());
    let escrow_client = EscrowContractClient::new(&env, &escrow_id);

    // Create Escrow
    escrow_client.create_escrow(&creator, &recipient, &500, &token_address, &1);

    // Assert funds are locked in Escrow Contract
    assert_eq!(token_client.balance(&creator), 500);
    assert_eq!(token_client.balance(&escrow_id), 500);

    // Assert Escrow values
    let escrow = escrow_client.get_escrow(&1).unwrap();
    assert_eq!(escrow.creator, creator);
    assert_eq!(escrow.recipient, recipient);
    assert_eq!(escrow.amount, 500);
    assert_eq!(escrow.status, EscrowStatus::Funded as u32);
}

#[test]
fn test_release_funds() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let recipient = Address::generate(&env);

    // Deploy Contracts
    let token_address = env.register_stellar_asset_contract(admin.clone());
    let token_client = token::Client::new(&env, &token_address);
    let token_admin = token::StellarAssetClient::new(&env, &token_address);
    token_admin.mint(&creator, &1000);

    let reputation_id = env.register(ReputationContract, ());
    let reputation_client = ReputationContractClient::new(&env, &reputation_id);
    reputation_client.initialize(&admin);

    let escrow_id = env.register(EscrowContract, ());
    let escrow_client = EscrowContractClient::new(&env, &escrow_id);

    reputation_client.set_escrow_contract(&escrow_id);

    // Create profile for user
    reputation_client.create_profile(&creator);
    reputation_client.create_profile(&recipient);

    // Create Escrow
    escrow_client.create_escrow(&creator, &recipient, &500, &token_address, &1);

    // Release funds
    escrow_client.release_funds(&1, &reputation_id);

    // Verify token transfers
    assert_eq!(token_client.balance(&escrow_id), 0);
    assert_eq!(token_client.balance(&recipient), 500);

    // Verify escrow status
    let escrow = escrow_client.get_escrow(&1).unwrap();
    assert_eq!(escrow.status, EscrowStatus::Released as u32);

    // Verify Reputation Updates
    let creator_profile = reputation_client.get_profile(&creator).unwrap();
    let recipient_profile = reputation_client.get_profile(&recipient).unwrap();

    assert_eq!(creator_profile.completed_contracts, 1);
    assert_eq!(creator_profile.reputation_score, 105); // 100 + 5
    assert_eq!(creator_profile.total_volume, 500);

    assert_eq!(recipient_profile.completed_contracts, 1);
    assert_eq!(recipient_profile.reputation_score, 105);
    assert_eq!(recipient_profile.total_volume, 500);
}

#[test]
fn test_refund_funds() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let recipient = Address::generate(&env);

    // Deploy Contracts
    let token_address = env.register_stellar_asset_contract(admin.clone());
    let token_client = token::Client::new(&env, &token_address);
    let token_admin = token::StellarAssetClient::new(&env, &token_address);
    token_admin.mint(&creator, &1000);

    let reputation_id = env.register(ReputationContract, ());
    let reputation_client = ReputationContractClient::new(&env, &reputation_id);
    reputation_client.initialize(&admin);

    let escrow_id = env.register(EscrowContract, ());
    let escrow_client = EscrowContractClient::new(&env, &escrow_id);

    reputation_client.set_escrow_contract(&escrow_id);

    // Create profiles
    reputation_client.create_profile(&creator);
    reputation_client.create_profile(&recipient);

    // Create Escrow
    escrow_client.create_escrow(&creator, &recipient, &500, &token_address, &1);

    // Refund funds
    escrow_client.refund_funds(&1, &reputation_id);

    // Verify token transfers (refunded to creator)
    assert_eq!(token_client.balance(&escrow_id), 0);
    assert_eq!(token_client.balance(&creator), 1000);

    // Verify escrow status
    let escrow = escrow_client.get_escrow(&1).unwrap();
    assert_eq!(escrow.status, EscrowStatus::Refunded as u32);

    // Verify Reputation Updates (recipient fail)
    let recipient_profile = reputation_client.get_profile(&recipient).unwrap();
    assert_eq!(recipient_profile.failed_contracts, 1);
    assert_eq!(recipient_profile.reputation_score, 85); // 100 - 15
}

#[test]
fn test_cancel_escrow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let recipient = Address::generate(&env);

    // Deploy Contracts
    let token_address = env.register_stellar_asset_contract(admin.clone());
    let token_client = token::Client::new(&env, &token_address);
    let token_admin = token::StellarAssetClient::new(&env, &token_address);
    token_admin.mint(&creator, &1000);

    let escrow_id = env.register(EscrowContract, ());
    let escrow_client = EscrowContractClient::new(&env, &escrow_id);

    // Create Escrow
    escrow_client.create_escrow(&creator, &recipient, &500, &token_address, &1);

    // Cancel Escrow
    escrow_client.cancel_escrow(&1);

    // Verify token transfers (returned to creator)
    assert_eq!(token_client.balance(&escrow_id), 0);
    assert_eq!(token_client.balance(&creator), 1000);

    // Verify status
    let escrow = escrow_client.get_escrow(&1).unwrap();
    assert_eq!(escrow.status, EscrowStatus::Cancelled as u32);
}

#[test]
fn test_dispute_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let recipient = Address::generate(&env);

    // Deploy Contracts
    let token_address = env.register_stellar_asset_contract(admin.clone());
    let token_client = token::Client::new(&env, &token_address);
    let token_admin = token::StellarAssetClient::new(&env, &token_address);
    token_admin.mint(&creator, &1000);

    let reputation_id = env.register(ReputationContract, ());
    let reputation_client = ReputationContractClient::new(&env, &reputation_id);
    reputation_client.initialize(&admin);

    let escrow_id = env.register(EscrowContract, ());
    let escrow_client = EscrowContractClient::new(&env, &escrow_id);

    reputation_client.set_escrow_contract(&escrow_id);

    // Create profiles
    reputation_client.create_profile(&creator);
    reputation_client.create_profile(&recipient);

    // Create Escrow
    escrow_client.create_escrow(&creator, &recipient, &500, &token_address, &1);

    // Open Dispute
    escrow_client.open_dispute(&1);

    // Verify Status
    let escrow = escrow_client.get_escrow(&1).unwrap();
    assert_eq!(escrow.status, EscrowStatus::Disputed as u32);

    // Resolve Dispute in favor of recipient (winner gets funds)
    escrow_client.resolve_dispute(&1, &recipient, &reputation_id);

    // Verify winner got funds
    assert_eq!(token_client.balance(&recipient), 500);

    // Verify status
    let escrow = escrow_client.get_escrow(&1).unwrap();
    assert_eq!(escrow.status, EscrowStatus::Released as u32);
}
