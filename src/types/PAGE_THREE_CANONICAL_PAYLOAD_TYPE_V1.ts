export type CanonicalRouteTarget = 'direction' | 'question' | 'blank_page' | 'compare';

export type CanonicalRouteDecision = {
  route_target: 'direction' | 'question' | 'blank_page';
  route_confidence: 'low' | 'medium' | 'high';
  route_reason_code: string;
  route_reason_detail: string;
  direction_generation_allowed: boolean;
  clarification_recommended: boolean;
  fallback_required: boolean;
};

export type CanonicalPage3Payload = {
  session_id: string;
  case_id: string | null;

  routing: {
    product_mode: string;
    effective_product_mode: string;
    direction_viable: boolean;
    route_target: CanonicalRouteTarget;
    route_reason: string;
    route_reason_code: string;
    is_fallback: boolean;
    fallback_reason_code: string | null;
    unknown_classifier: boolean;
    unknown_driver_codes: string[];
    route_decision: CanonicalRouteDecision;
  };

  source_truth: {
    raw_input: string;
    normalized_input: string;
    raw_note_count: number;
    preserved_source_fragments: string[];
    preserved_anchor_terms: string[];
    signal_summary: string[];
    story_entries_snapshot: Array<{
      id: string;
      title: string;
      text: string;
    }>;
    raw_vs_structured_alignment: {
      raw_feature_count: number;
      structured_feature_count: number;
      differences: string[];
    };
  };

  classification: {
    primary_pattern: string;
    secondary_patterns: string[];
    signal_strength: 'low' | 'medium' | 'high';
    student_scene_evidence: 'absent' | 'weak' | 'present';
    contamination_risk: string | null;
    recommendation_viability: string;
    recommendation_viability_reason: string;
  };

  recommendation_packet: {
    displayed_recommendation: string;
    essay_about: string;
    why_this_direction: string;
    weaker_read: string;
    stronger_read: string;
    next_step?: string | null;
    first_coaching_step: string | null;
    evidence_lines: string[];
    evidence_explanations: string[];
  };

  candidate_debug: {
    candidates_generated: number;
    winner_before_reweight_id?: string | null;
    winner_id: string;
    winner_family?: string | null;
    weaker_read_source_id: string | null;
    weaker_read_family?: string | null;
    scores_by_candidate: Array<{
      id: string;
      recommendation_family?: string;
      angle_type?: string;
      surface_shell_id?: string;
      shell_penalty_hits?: string[];
      rejection_reasons?: string[];
      angle_directness?: number;
      angle_first_quality?: number;
      essay_angle_naming_quality?: number;
      essay_about_conceptual_lift?: number;
      case_specificity_beyond_pivot?: number;
      family_diversity_survival?: number;
      batch_diversity_credit?: number;
      ambiguity_decision_helpfulness?: number;
      source_grounding: number;
      source_faithfulness: number;
      essay_aboutness_clarity: number;
      directional_usefulness: number;
      why_quality: number;
      coaching_actionability: number;
      draftability: number;
      non_repeatability: number;
      decision_shell_penalty?: number;
      family_collapse_penalty?: number;
      dominant_family_overuse_penalty?: number;
      packet_family_sameness_penalty?: number;
      batch_family_distribution_penalty?: number;
      pre_penalty_total?: number;
      post_penalty_total?: number;
      translation_penalty: number;
      template_scaffold_penalty: number;
      total: number;
    }>;
  };

  evaluation_metadata: {
    canonical_payload_version: string;
    render_contract_version: string;
    evaluator_contract_version: string;
  };
};
