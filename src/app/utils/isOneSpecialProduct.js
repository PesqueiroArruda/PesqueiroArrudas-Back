function isOneSpecialProduct(str) {
  const strFormatted = str.toLowerCase().replace(/[^A-Za-z]/gi, '');
  const options = [
    'pesquepague',
    'pescapague',
    'pescaesportiva',
    'pesqueesportiva',
  ];

  if (options.some((opt) => opt === strFormatted)) {
    return true;
  }
  return false;
}

module.exports = { isOneSpecialProduct };
