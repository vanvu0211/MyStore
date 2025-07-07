export const formatCurrency = (amount) => {
  if (isNaN(amount) || amount == null) return '0 ';
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}; 