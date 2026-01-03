import { EvidenceItem } from '../primitives/EvidenceItem';
import { EvidenceReport } from '../primitives/EvidenceReport';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateEvidenceItem(item: EvidenceItem): ValidationResult {
  const errors: string[] = [];

  if (!item.id || item.id.trim() === '') {
    errors.push('EvidenceItem must have a non-empty id');
  }

  if (!item.type) {
    errors.push('EvidenceItem must have a type');
  }

  if (!item.source || !item.source.kind || item.source.kind.trim() === '') {
    errors.push('EvidenceItem must have a non-empty source.kind');
  }

  if (!item.source || !item.source.ref || item.source.ref.trim() === '') {
    errors.push('EvidenceItem must have a non-empty source.ref');
  }

  if (!item.excerpt || item.excerpt.trim() === '') {
    errors.push('EvidenceItem must have a non-empty excerpt');
  }

  if (typeof item.confidence_weight !== 'number' || item.confidence_weight < 0 || item.confidence_weight > 1) {
    errors.push('EvidenceItem confidence_weight must be a number between 0 and 1');
  }

  if (typeof item.verified !== 'boolean') {
    errors.push('EvidenceItem verified must be a boolean');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateEvidenceReport(report: EvidenceReport): ValidationResult {
  const errors: string[] = [];

  if (!report.id || report.id.trim() === '') {
    errors.push('EvidenceReport must have a non-empty id');
  }

  if (!report.items || report.items.length === 0) {
    errors.push('EvidenceReport must have at least one EvidenceItem');
  }

  if (report.items) {
    report.items.forEach((item, index) => {
      const itemValidation = validateEvidenceItem(item);
      if (!itemValidation.valid) {
        errors.push(`EvidenceItem at index ${index} is invalid: ${itemValidation.errors.join(', ')}`);
      }
    });
  }

  if (typeof report.confidence_score !== 'number' || report.confidence_score < 0 || report.confidence_score > 100) {
    errors.push('EvidenceReport confidence_score must be a number between 0 and 100');
  }

  if (!['tier_1', 'tier_2', 'tier_3'].includes(report.evidence_tier)) {
    errors.push('EvidenceReport evidence_tier must be tier_1, tier_2, or tier_3');
  }

  if (!report.coverage_summary || report.coverage_summary.trim() === '') {
    errors.push('EvidenceReport must have a non-empty coverage_summary');
  }

  if (!Array.isArray(report.limitations)) {
    errors.push('EvidenceReport limitations must be an array');
  }

  if (!Array.isArray(report.assumptions)) {
    errors.push('EvidenceReport assumptions must be an array');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function calculateConfidenceScore(items: EvidenceItem[]): number {
  if (items.length === 0) return 0;

  const verifiedItems = items.filter(item => item.verified);
  const verifiedRatio = verifiedItems.length / items.length;
  
  const avgWeight = items.reduce((sum, item) => sum + item.confidence_weight, 0) / items.length;
  
  const baseScore = (verifiedRatio * 0.6 + avgWeight * 0.4) * 100;
  
  return Math.min(100, Math.max(0, Math.round(baseScore)));
}
