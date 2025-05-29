/**
 * Customer utility functions for handling customer data display
 */

/**
 * Get initials from a name or company name
 * @param name The customer name (can be null for corporate customers)
 * @param companyName The company name (for corporate customers)
 * @returns The initials as uppercase string
 */
export const getCustomerInitials = (name: string | null, companyName?: string): string => {
  const textToUse = name || companyName || '';
  
  if (!textToUse) return 'N/A';
  
  return textToUse
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
};

/**
 * Get the display name for a customer based on type
 * @param customer The customer object
 * @returns The appropriate display name (name for individuals, companyName for corporates)
 */
export const getCustomerDisplayName = (customer: any): string => {
  // For corporate customers, name might be null and we should use companyName
  return customer.name || customer.companyName || 'Unknown';
};