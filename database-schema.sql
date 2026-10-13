CREATE TYPE "public"."account_type" AS ENUM('Asset', 'Liability', 'Equity', 'Income', 'Expense');
CREATE TYPE "public"."card_provider" AS ENUM('Visa', 'Mastercard', 'Amex', 'Discover');
CREATE TYPE "public"."card_type" AS ENUM('Virtual', 'Physical', 'Fleet', 'Gas');
CREATE TYPE "public"."entity" AS ENUM('LLC', 'Trust');
CREATE TYPE "public"."line_type" AS ENUM('DEBIT', 'CREDIT');
CREATE TYPE "public"."payment_method" AS ENUM('ACH', 'Wire', 'Crypto');
CREATE TYPE "public"."spend_category" AS ENUM('Fuel', 'Office', 'Travel', 'Software', 'Hardware', 'Other');
CREATE TYPE "public"."status" AS ENUM('Active', 'Inactive', 'Pending', 'Posted', 'Draft', 'Approved', 'Fulfilled', 'Paid', 'Issued', 'Overdue');
CREATE TYPE "public"."vendor_category" AS ENUM('Software', 'Hardware', 'Services', 'Supplies', 'Professional', 'Other');
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "account_type" NOT NULL,
	"entity" "entity" NOT NULL,
	"organization_id" integer,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "ach_payments" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"stripe_charge_id" varchar(255),
	"stripe_payment_intent_id" varchar(255),
	"customer_id" varchar(36) NOT NULL,
	"payment_method_id" varchar(36) NOT NULL,
	"amount_cents" varchar(20) NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD',
	"description" text,
	"purpose" varchar(100),
	"status" varchar(50) NOT NULL,
	"payment_method_type" varchar(50) DEFAULT 'ach_debit',
	"ach_class_code" varchar(10) DEFAULT 'PPD',
	"company_identification" varchar(50),
	"company_name" varchar(255),
	"scheduled_date" varchar(10),
	"processed_date" timestamp,
	"estimated_settlement_date" varchar(10),
	"actual_settlement_date" timestamp,
	"return_code" varchar(10),
	"return_description" text,
	"failure_reason" text,
	"invoice_id" varchar(36),
	"journal_entry_id" varchar(50),
	"stripe_metadata" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ach_payments_stripe_charge_id_unique" UNIQUE("stripe_charge_id")
);

CREATE TABLE "ach_processing_log" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"ach_payment_id" varchar(36),
	"stripe_charge_id" varchar(255),
	"processing_fee_cents" varchar(20) NOT NULL,
	"processing_date" timestamp DEFAULT now(),
	"account_id" integer NOT NULL,
	"journal_entry_id" varchar(50),
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "ach_returns" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"ach_payment_id" varchar(36) NOT NULL,
	"return_code" varchar(10) NOT NULL,
	"return_reason" varchar(255),
	"returned_at" timestamp DEFAULT now(),
	"corrected" boolean DEFAULT false,
	"correction_date" timestamp,
	"correction_method" varchar(100),
	"adjusted_amount_cents" varchar(20),
	"new_payment_date" varchar(10),
	"notes" text,
	"adjustment_journal_entry_id" varchar(50),
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "audit_evidence" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"evidence_type" varchar(100) NOT NULL,
	"file_path" varchar(500),
	"file_hash" varchar(128),
	"file_size" integer,
	"mime_type" varchar(100),
	"audit_trail_id" varchar(36),
	"entity_type" varchar(100),
	"entity_id" varchar(36),
	"compliance_relevant" boolean DEFAULT false,
	"regulatory_standard" varchar(100),
	"requirement_reference" varchar(255),
	"retention_period" integer,
	"expiry_date" varchar(10),
	"verified" boolean DEFAULT false,
	"verified_by" varchar(36),
	"verification_date" timestamp,
	"verification_method" varchar(100),
	"verification_notes" text,
	"confidentiality_level" varchar(20) DEFAULT 'internal',
	"access_restrictions" text,
	"source" varchar(255),
	"created_by" varchar(36) NOT NULL,
	"tags" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "audit_trails" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" varchar(36),
	"user_id" varchar(36),
	"user_email" varchar(255),
	"user_role" varchar(100),
	"ip_address" varchar(45),
	"user_agent" text,
	"session_id" varchar(255),
	"action" varchar(100) NOT NULL,
	"description" text,
	"old_values" text,
	"new_values" text,
	"context" text,
	"metadata" text,
	"tags" text,
	"compliance_relevant" boolean DEFAULT false,
	"regulatory_standard" varchar(100),
	"evidence_type" varchar(100),
	"retention_period" integer,
	"timestamp" timestamp DEFAULT now(),
	"severity" varchar(20) DEFAULT 'info',
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "card_reveal_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" varchar(50) NOT NULL,
	"revealed_by" varchar(255) NOT NULL,
	"reason" text NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"timestamp" timestamp DEFAULT now()
);

CREATE TABLE "card_transactions" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"card_id" varchar(50) NOT NULL,
	"merchant_name" varchar(255) NOT NULL,
	"merchant_category" "spend_category" NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"transaction_date" varchar(10) NOT NULL,
	"posting_date" varchar(10) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(20) NOT NULL,
	"location" varchar(255),
	"accounting_code" varchar(20),
	"notes" text,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "company_cards" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"last4" varchar(4) NOT NULL,
	"provider_token_id" varchar(255),
	"card_type" "card_type" NOT NULL,
	"card_provider" "card_provider" NOT NULL,
	"assigned_to" varchar(255),
	"spending_limit_daily" numeric(15, 2),
	"spending_limit_monthly" numeric(15, 2),
	"spending_limit_transaction" numeric(15, 2),
	"status" varchar(20) DEFAULT 'Active' NOT NULL,
	"issue_date" varchar(10) NOT NULL,
	"expiry_date" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "compliance_alerts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"severity" varchar(20) DEFAULT 'medium',
	"status" varchar(20) DEFAULT 'open',
	"entity_type" varchar(100),
	"entity_id" varchar(36),
	"related_alerts" text,
	"trigger_condition" text,
	"threshold" text,
	"triggered_date" timestamp DEFAULT now(),
	"acknowledged_date" timestamp,
	"acknowledged_by" varchar(36),
	"resolved_date" timestamp,
	"resolved_by" varchar(36),
	"assigned_to" varchar(36),
	"priority" varchar(20) DEFAULT 'medium',
	"due_date" varchar(10),
	"actions_taken" text,
	"resolution" text,
	"tags" text,
	"metadata" text,
	"source" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "compliance_checklist" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"checklist_type" varchar(100) NOT NULL,
	"item_description" varchar(255) NOT NULL,
	"requirement" varchar(500) NOT NULL,
	"status" varchar(50) NOT NULL,
	"assigned_to" varchar(36),
	"due_date" varchar(10),
	"completion_date" varchar(10),
	"verification_method" varchar(100),
	"verification_evidence" text,
	"verification_date" timestamp,
	"verifier_user_id" varchar(36),
	"regulatory_standard" varchar(100),
	"regulatory_section" varchar(100),
	"risk_level" varchar(20) DEFAULT 'medium',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);

CREATE TABLE "compliance_gaps" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"requirement_id" varchar(36),
	"title" varchar(500) NOT NULL,
	"description" text,
	"severity" varchar(20) DEFAULT 'medium',
	"status" varchar(20) DEFAULT 'open',
	"identified_date" varchar(10) NOT NULL,
	"target_resolution_date" varchar(10),
	"actual_resolution_date" varchar(10),
	"assigned_to" varchar(36),
	"remediation_steps" text,
	"evidence" text,
	"risk_level" numeric(5, 2),
	"business_impact" text,
	"dependencies" text,
	"related_gaps" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "compliance_health_scores" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"overall_score" numeric(5, 2) NOT NULL,
	"data_protection_score" numeric(5, 2),
	"financial_controls_score" numeric(5, 2),
	"operational_score" numeric(5, 2),
	"security_score" numeric(5, 2),
	"calculated_date" timestamp DEFAULT now(),
	"calculation_period" varchar(20) DEFAULT 'monthly',
	"trend_direction" varchar(20),
	"previous_score" numeric(5, 2),
	"factors" text,
	"recommendations" text,
	"status" varchar(20) DEFAULT 'active',
	"calculated_by" varchar(36)
);

CREATE TABLE "compliance_policies" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'draft',
	"version" varchar(50) NOT NULL,
	"type" varchar(50) DEFAULT 'policy',
	"priority" varchar(20) DEFAULT 'medium',
	"owner" varchar(255) NOT NULL,
	"department" varchar(255) NOT NULL,
	"effective_date" varchar(10) NOT NULL,
	"expiry_date" varchar(10),
	"last_review_date" varchar(10),
	"next_review_date" varchar(10),
	"approval_workflow" text,
	"content" text,
	"requirements" text,
	"stakeholders" text,
	"attachments" text,
	"tags" text,
	"related_policies" text,
	"compliance_metrics" text,
	"keywords" text,
	"language" varchar(10) DEFAULT 'en',
	"confidentiality_level" varchar(20) DEFAULT 'internal',
	"created_by" varchar(36) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "compliance_reports" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"description" text,
	"type" varchar(50) DEFAULT 'operational',
	"status" varchar(20) DEFAULT 'draft',
	"template" text,
	"parameters" text,
	"filters" text,
	"data" text,
	"generated_date" timestamp DEFAULT now(),
	"period" varchar(100),
	"start_date" varchar(10),
	"end_date" varchar(10),
	"schedule" text,
	"recipients" text,
	"version" varchar(50) DEFAULT '1.0.0',
	"confidentiality" varchar(20) DEFAULT 'internal',
	"retention_period" integer,
	"tags" text,
	"data_sources" text,
	"created_by" varchar(36) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"last_generated" timestamp,
	"generation_count" integer DEFAULT 0
);

CREATE TABLE "compliance_standards" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(100) NOT NULL,
	"version" varchar(50) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"jurisdiction" varchar(100),
	"effective_date" varchar(10),
	"expiry_date" varchar(10),
	"status" varchar(20) DEFAULT 'active',
	"requirements" text,
	"scoring_methodology" text,
	"last_assessment_date" timestamp,
	"next_assessment_date" timestamp,
	"compliance_level" numeric(5, 2),
	"evidence_required" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "compliance_standards_code_unique" UNIQUE("code")
);

CREATE TABLE "consul_credits_config" (
	"id" varchar(50) PRIMARY KEY DEFAULT 'default' NOT NULL,
	"contract_address" varchar(42) NOT NULL,
	"network_name" varchar(100) NOT NULL,
	"chain_id" integer NOT NULL,
	"rpc_url" text NOT NULL,
	"oracle_integrator_address" varchar(42) NOT NULL,
	"confirmations_required" integer DEFAULT 3 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "consul_credits_transactions" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"tx_hash" varchar(66) NOT NULL,
	"block_number" integer NOT NULL,
	"timestamp" timestamp NOT NULL,
	"event_type" varchar(20) NOT NULL,
	"user_address" varchar(42) NOT NULL,
	"token_address" varchar(42) NOT NULL,
	"token_symbol" varchar(10) NOT NULL,
	"token_amount" varchar(50) NOT NULL,
	"consul_credits_amount" varchar(50) NOT NULL,
	"exchange_rate" varchar(50) NOT NULL,
	"ledger_reference" varchar(50),
	"journal_entry_id" varchar(50),
	"confirmations" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "customers" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"stripe_customer_id" varchar(255) NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"stripe_default_payment_method_id" varchar(255),
	"billing_address" text,
	"shipping_address" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"stripe_created_at" timestamp,
	"stripe_updated_at" timestamp,
	"active" boolean DEFAULT true,
	"customer_id" integer,
	"stripe_metadata" text,
	"deleted_at" timestamp,
	CONSTRAINT "customers_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);

CREATE TABLE "direct_deposit_bank_accounts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"recipient_id" varchar(36) NOT NULL,
	"stripe_bank_account_id" varchar(255) NOT NULL,
	"account_holder_name" varchar(255) NOT NULL,
	"bank_name" varchar(255) NOT NULL,
	"routing_number" varchar(9) NOT NULL,
	"account_number_last4" varchar(4) NOT NULL,
	"account_type" varchar(20) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"status" varchar(50) DEFAULT 'pending',
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp,
	"default_currency" varchar(3),
	"is_default" boolean DEFAULT false,
	"stripe_metadata" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "direct_deposit_bank_accounts_stripe_bank_account_id_unique" UNIQUE("stripe_bank_account_id")
);

CREATE TABLE "direct_deposit_payouts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"stripe_payout_id" varchar(255),
	"recipient_id" varchar(36) NOT NULL,
	"amount_cents" varchar(20) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"description" text,
	"pay_period_start" varchar(10),
	"pay_period_end" varchar(10),
	"scheduled_payout_date" varchar(10),
	"actual_payout_date" timestamp,
	"estimated_arrival_date" timestamp,
	"status" varchar(50) NOT NULL,
	"failure_reason" text,
	"destination_bank_account_id" varchar(36),
	"payroll_run_id" varchar(36),
	"journal_entry_id" varchar(50),
	"stripe_metadata" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "direct_deposit_payouts_stripe_payout_id_unique" UNIQUE("stripe_payout_id")
);

CREATE TABLE "direct_deposit_recipients" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"stripe_account_id" varchar(255) NOT NULL,
	"employee_id" varchar(36),
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"date_of_birth" varchar(10),
	"ssn_last4" varchar(4),
	"address" text,
	"verification_status" varchar(50) DEFAULT 'pending',
	"verification_required" boolean DEFAULT true,
	"verification_due_date" varchar(10),
	"account_status" varchar(50) DEFAULT 'pending',
	"requires_verification" boolean DEFAULT true,
	"verification_fields_needed" text,
	"verification_disabled_reason" varchar(255),
	"kyc_status" varchar(50),
	"charges_enabled" boolean DEFAULT false,
	"transfers_enabled" boolean DEFAULT false,
	"payouts_enabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "direct_deposit_recipients_stripe_account_id_unique" UNIQUE("stripe_account_id")
);

CREATE TABLE "employees" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"annual_salary" numeric(15, 2) NOT NULL,
	"bank_routing_number" varchar(9),
	"bank_account_number" varchar(20),
	"payment_method" "payment_method" DEFAULT 'ACH',
	"tax_id" varchar(11),
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "investors" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"accredited_status" boolean DEFAULT false NOT NULL,
	"kyc_status" varchar(50) DEFAULT 'Pending' NOT NULL,
	"tax_id" varchar(20),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "investors_email_unique" UNIQUE("email")
);

CREATE TABLE "invoices" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"type" varchar(2) NOT NULL,
	"counterparty" varchar(255) NOT NULL,
	"issue_date" varchar(10) NOT NULL,
	"due_date" varchar(10) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"status" "status" DEFAULT 'Issued' NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "journal_entries" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"date" varchar(10) NOT NULL,
	"description" text NOT NULL,
	"source" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'Posted' NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "journal_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"journal_entry_id" varchar(50) NOT NULL,
	"account_id" integer NOT NULL,
	"type" "line_type" NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"tax_id" varchar(20),
	"type" varchar(50) NOT NULL,
	"address" text,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "payment_methods" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"customer_id" varchar(36) NOT NULL,
	"stripe_payment_method_id" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"card_last4" varchar(4),
	"card_brand" varchar(50),
	"card_exp_month" integer,
	"card_exp_year" integer,
	"bank_name" varchar(255),
	"bank_account_last4" varchar(4),
	"bank_account_routing_number" varchar(9),
	"bank_account_type" varchar(20),
	"status" varchar(50) DEFAULT 'active',
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"verified_at" timestamp,
	"verification_status" varchar(50),
	"stripe_metadata" text,
	"setup_intent_id" varchar(255),
	"updated_by" varchar(36),
	"deleted_at" timestamp,
	CONSTRAINT "payment_methods_stripe_payment_method_id_unique" UNIQUE("stripe_payment_method_id")
);

CREATE TABLE "payment_reconciliation" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"stripe_balance_transaction_id" varchar(255),
	"amount_cents" varchar(20) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"net_cents" varchar(20) NOT NULL,
	"fee_cents" varchar(20) DEFAULT '0',
	"type" varchar(50) NOT NULL,
	"ach_payment_id" varchar(36),
	"direct_deposit_payout_id" varchar(36),
	"stripe_created" timestamp,
	"stripe_available_on" timestamp,
	"stripe_status" varchar(50),
	"matched_journal_entry_id" varchar(50),
	"reconciled_at" timestamp,
	"reconciled_by" varchar(36),
	"description" text,
	"stripe_metadata" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payment_reconciliation_stripe_balance_transaction_id_unique" UNIQUE("stripe_balance_transaction_id")
);

CREATE TABLE "pci_audit_log" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"action_type" varchar(100) NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" varchar(255) NOT NULL,
	"user_id" varchar(36),
	"user_email" varchar(255),
	"ip_address" varchar(45),
	"user_agent" text,
	"session_id" varchar(255),
	"sensitive_fields_accessed" text,
	"data_masked" boolean DEFAULT true,
	"access_purpose" text,
	"retention_period_days" integer,
	"old_values" text,
	"new_values" text,
	"additional_context" text,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "policy_audit_trail" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"policy_id" varchar(36) NOT NULL,
	"version" varchar(50) NOT NULL,
	"action" varchar(50) NOT NULL,
	"performed_by" varchar(36) NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"details" text,
	"previous_value" text,
	"new_value" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "policy_versions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"policy_id" varchar(36) NOT NULL,
	"version" varchar(50) NOT NULL,
	"change_date" varchar(10) NOT NULL,
	"changed_by" varchar(36) NOT NULL,
	"change_type" varchar(50) NOT NULL,
	"change_description" text,
	"reason" varchar(500),
	"approval_status" varchar(20) DEFAULT 'pending',
	"approved_by" varchar(36),
	"approved_date" varchar(10),
	"changes" text,
	"review_cycle" varchar(50),
	"content" text,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "purchase_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_order_id" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "purchase_orders" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"vendor" varchar(255) NOT NULL,
	"date" varchar(10) NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"status" "status" DEFAULT 'Draft' NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "regulatory_changes" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"requirement_id" varchar(36),
	"change_type" varchar(50) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"impact_level" varchar(20) DEFAULT 'medium',
	"affected_requirements" text,
	"announcement_date" varchar(10) NOT NULL,
	"effective_date" varchar(10),
	"compliance_deadline" varchar(10),
	"status" varchar(20) DEFAULT 'published',
	"impact_assessment" text,
	"action_required" text,
	"related_documents" text,
	"source" varchar(255),
	"jurisdiction" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "regulatory_requirements" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"standard_id" varchar(36),
	"code" varchar(100) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"jurisdiction" varchar(100) NOT NULL,
	"category" varchar(100) NOT NULL,
	"priority" varchar(20) DEFAULT 'medium',
	"status" varchar(20) DEFAULT 'active',
	"effective_date" varchar(10) NOT NULL,
	"last_updated" varchar(10) NOT NULL,
	"next_review_date" varchar(10),
	"compliance_level" numeric(5, 2),
	"requirements" text,
	"documentation" text,
	"tags" text,
	"related_requirements" text,
	"authority" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "risk_assessments" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"subcategory" varchar(100),
	"likelihood" integer NOT NULL,
	"impact" integer NOT NULL,
	"risk_score" integer NOT NULL,
	"inherent_risk" integer,
	"residual_risk" integer,
	"status" varchar(20) DEFAULT 'identified',
	"owner" varchar(36),
	"department" varchar(255),
	"identified_date" varchar(10) NOT NULL,
	"assessment_date" varchar(10),
	"next_review_date" varchar(10),
	"business_units" text,
	"stakeholders" text,
	"risk_factors" text,
	"controls" text,
	"mitigation_plan" text,
	"monitoring" text,
	"escalation" text,
	"evidence" text,
	"related_risks" text,
	"tags" text,
	"created_by" varchar(36) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "risk_mitigation_actions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"risk_id" varchar(36) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"action_type" varchar(50),
	"priority" varchar(20) DEFAULT 'medium',
	"status" varchar(20) DEFAULT 'planned',
	"assigned_to" varchar(36),
	"due_date" varchar(10),
	"completed_date" varchar(10),
	"effort" varchar(100),
	"cost" numeric(15, 2),
	"effectiveness" varchar(20),
	"progress" numeric(5, 2),
	"dependencies" text,
	"resources" text,
	"deliverables" text,
	"validation" text,
	"evidence" text,
	"notes" text,
	"created_by" varchar(36) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "securities" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"ticker" varchar(10) NOT NULL,
	"name" varchar(255) NOT NULL,
	"asset_type" varchar(50) NOT NULL,
	"total_supply" numeric(20, 6) NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "shareholders" (
	"id" serial PRIMARY KEY NOT NULL,
	"investor_id" varchar(36) NOT NULL,
	"security_id" integer NOT NULL,
	"shares_owned" numeric(20, 6) NOT NULL,
	"purchase_date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "stripe_account_mappings" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"stripe_account_type" varchar(100) NOT NULL,
	"account_id" integer NOT NULL,
	"description" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "stripe_account_mappings_stripe_account_type_unique" UNIQUE("stripe_account_type")
);

CREATE TABLE "stripe_payment_reconciliation" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"stripe_balance_transaction_id" varchar(255),
	"amount_cents" varchar(20) NOT NULL,
	"fee_cents" varchar(20) DEFAULT '0',
	"net_cents" varchar(20) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"transaction_type" varchar(50) NOT NULL,
	"stripe_created" timestamp,
	"available_on" timestamp,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"account_id" integer NOT NULL,
	"journal_entry_id" varchar(50),
	"reconciled_at" timestamp,
	"reconciled_by" varchar(255),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "stripe_payment_reconciliation_stripe_balance_transaction_id_unique" UNIQUE("stripe_balance_transaction_id")
);

CREATE TABLE "stripe_webhook_events" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"stripe_event_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"api_version" varchar(20),
	"request_id" varchar(255),
	"request_idempotency_key" varchar(255),
	"event_data" text NOT NULL,
	"livemode" boolean DEFAULT false,
	"pending_webhooks" integer DEFAULT 0,
	"processed_at" timestamp,
	"processing_status" varchar(50) DEFAULT 'pending',
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"customer_id" varchar(36),
	"payment_method_id" varchar(36),
	"ach_payment_id" varchar(36),
	"direct_deposit_recipient_id" varchar(36),
	"direct_deposit_payout_id" varchar(36),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "stripe_webhook_events_stripe_event_id_unique" UNIQUE("stripe_event_id")
);

CREATE TABLE "system_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"level" varchar(20) NOT NULL,
	"source" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"metadata" text
);

CREATE TABLE "training_certificates" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"program_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"title" varchar(500) NOT NULL,
	"issued_date" varchar(10) NOT NULL,
	"expiry_date" varchar(10),
	"certificate_number" varchar(100),
	"verification_code" varchar(100),
	"template" varchar(255),
	"metadata" text,
	"digital_signature" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "training_certificates_certificate_number_unique" UNIQUE("certificate_number"),
	CONSTRAINT "training_certificates_verification_code_unique" UNIQUE("verification_code")
);

CREATE TABLE "training_enrollments" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"program_id" varchar(36) NOT NULL,
	"enrollment_date" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'enrolled',
	"progress" text,
	"assessment_results" text,
	"certificate" text,
	"completion_date" varchar(10),
	"due_date" varchar(10),
	"assigned_by" varchar(36),
	"priority" varchar(20) DEFAULT 'medium',
	"tags" text,
	"notes" text,
	"last_activity" timestamp DEFAULT now(),
	"time_spent" integer,
	"attempts" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "training_programs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"type" varchar(50) DEFAULT 'onboarding',
	"priority" varchar(20) DEFAULT 'medium',
	"status" varchar(20) DEFAULT 'draft',
	"version" varchar(50) NOT NULL,
	"effective_date" varchar(10) NOT NULL,
	"expiry_date" varchar(10),
	"duration" integer,
	"difficulty" varchar(20) DEFAULT 'beginner',
	"format" varchar(50) DEFAULT 'online',
	"language" varchar(10) DEFAULT 'en',
	"estimated_cost" numeric(15, 2),
	"prerequisites" text,
	"objectives" text,
	"target_audience" text,
	"course" text,
	"assessment" text,
	"requirements" text,
	"analytics" text,
	"metadata" text,
	"created_by" varchar(36) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"last_updated" timestamp DEFAULT now(),
	"next_review_date" varchar(10)
);

CREATE TABLE "training_schedules" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"program_id" varchar(36) NOT NULL,
	"title" varchar(500) NOT NULL,
	"type" varchar(50),
	"start_date" varchar(10) NOT NULL,
	"end_date" varchar(10) NOT NULL,
	"start_time" varchar(10) NOT NULL,
	"end_time" varchar(10) NOT NULL,
	"timezone" varchar(50) DEFAULT 'UTC',
	"location" text,
	"instructor" varchar(255) NOT NULL,
	"capacity" integer,
	"enrolled_count" integer DEFAULT 0,
	"waitlist_count" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'scheduled',
	"prerequisites" text,
	"materials" text,
	"registration_deadline" varchar(10),
	"cancellation_policy" text,
	"reminder_settings" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "vendors" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_person" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"address" text NOT NULL,
	"payment_terms" varchar(100) NOT NULL,
	"bank_account_number" varchar(20),
	"bank_routing_number" varchar(9),
	"tax_id" varchar(20) NOT NULL,
	"status" "status" DEFAULT 'Active' NOT NULL,
	"category" "vendor_category" NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);

ALTER TABLE "accounts" ADD CONSTRAINT "accounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "ach_payments" ADD CONSTRAINT "ach_payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "ach_payments" ADD CONSTRAINT "ach_payments_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "ach_payments" ADD CONSTRAINT "ach_payments_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "ach_processing_log" ADD CONSTRAINT "ach_processing_log_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "ach_processing_log" ADD CONSTRAINT "ach_processing_log_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "ach_returns" ADD CONSTRAINT "ach_returns_ach_payment_id_ach_payments_id_fk" FOREIGN KEY ("ach_payment_id") REFERENCES "public"."ach_payments"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "ach_returns" ADD CONSTRAINT "ach_returns_adjustment_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("adjustment_journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "audit_evidence" ADD CONSTRAINT "audit_evidence_audit_trail_id_audit_trails_id_fk" FOREIGN KEY ("audit_trail_id") REFERENCES "public"."audit_trails"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "compliance_gaps" ADD CONSTRAINT "compliance_gaps_requirement_id_regulatory_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."regulatory_requirements"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "direct_deposit_bank_accounts" ADD CONSTRAINT "direct_deposit_bank_accounts_recipient_id_direct_deposit_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."direct_deposit_recipients"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "direct_deposit_payouts" ADD CONSTRAINT "direct_deposit_payouts_recipient_id_direct_deposit_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."direct_deposit_recipients"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "direct_deposit_payouts" ADD CONSTRAINT "direct_deposit_payouts_destination_bank_account_id_direct_deposit_bank_accounts_id_fk" FOREIGN KEY ("destination_bank_account_id") REFERENCES "public"."direct_deposit_bank_accounts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "direct_deposit_payouts" ADD CONSTRAINT "direct_deposit_payouts_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "direct_deposit_recipients" ADD CONSTRAINT "direct_deposit_recipients_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "payment_reconciliation" ADD CONSTRAINT "payment_reconciliation_ach_payment_id_ach_payments_id_fk" FOREIGN KEY ("ach_payment_id") REFERENCES "public"."ach_payments"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "payment_reconciliation" ADD CONSTRAINT "payment_reconciliation_direct_deposit_payout_id_direct_deposit_payouts_id_fk" FOREIGN KEY ("direct_deposit_payout_id") REFERENCES "public"."direct_deposit_payouts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "payment_reconciliation" ADD CONSTRAINT "payment_reconciliation_matched_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("matched_journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "policy_audit_trail" ADD CONSTRAINT "policy_audit_trail_policy_id_compliance_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."compliance_policies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "policy_versions" ADD CONSTRAINT "policy_versions_policy_id_compliance_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."compliance_policies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "regulatory_changes" ADD CONSTRAINT "regulatory_changes_requirement_id_regulatory_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."regulatory_requirements"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "regulatory_requirements" ADD CONSTRAINT "regulatory_requirements_standard_id_compliance_standards_id_fk" FOREIGN KEY ("standard_id") REFERENCES "public"."compliance_standards"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "risk_mitigation_actions" ADD CONSTRAINT "risk_mitigation_actions_risk_id_risk_assessments_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."risk_assessments"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "securities" ADD CONSTRAINT "securities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "shareholders" ADD CONSTRAINT "shareholders_investor_id_investors_id_fk" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "shareholders" ADD CONSTRAINT "shareholders_security_id_securities_id_fk" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "stripe_account_mappings" ADD CONSTRAINT "stripe_account_mappings_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "stripe_payment_reconciliation" ADD CONSTRAINT "stripe_payment_reconciliation_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "stripe_payment_reconciliation" ADD CONSTRAINT "stripe_payment_reconciliation_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "stripe_webhook_events" ADD CONSTRAINT "stripe_webhook_events_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "stripe_webhook_events" ADD CONSTRAINT "stripe_webhook_events_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "stripe_webhook_events" ADD CONSTRAINT "stripe_webhook_events_ach_payment_id_ach_payments_id_fk" FOREIGN KEY ("ach_payment_id") REFERENCES "public"."ach_payments"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "stripe_webhook_events" ADD CONSTRAINT "stripe_webhook_events_direct_deposit_recipient_id_direct_deposit_recipients_id_fk" FOREIGN KEY ("direct_deposit_recipient_id") REFERENCES "public"."direct_deposit_recipients"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "stripe_webhook_events" ADD CONSTRAINT "stripe_webhook_events_direct_deposit_payout_id_direct_deposit_payouts_id_fk" FOREIGN KEY ("direct_deposit_payout_id") REFERENCES "public"."direct_deposit_payouts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "training_certificates" ADD CONSTRAINT "training_certificates_program_id_training_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_program_id_training_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "training_schedules" ADD CONSTRAINT "training_schedules_program_id_training_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE no action ON UPDATE no action;
