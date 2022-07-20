const someIsEmpty = (values) => {
  const someIsNull = values.some((value) => {
    if (!value && value !== 0) {
      return true;
    }
    return false;
  });
  return someIsNull;
};

module.exports = { someIsEmpty };
