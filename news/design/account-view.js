/** Consequential display state: partial evidence removes the last claim's usable records. */
export function claimView(account, index, mode) {
  const claim = account.claims[index];
  if (mode === 'partial' && index === account.claims.length - 1)
    return {
      ...claim,
      status: 'Unassessed: evidence unavailable',
      evidence:
        'No usable evidence record is available for this claim in the partial account.',
      limit:
        'The claim remains unresolved. Missing evidence does not prove absence or make the claim false.',
      family: 'No usable evidence record',
    };
  return claim;
}
