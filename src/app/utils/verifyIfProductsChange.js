const verifyChanges = (produtosAntigos, novosProdutos) => {
  let mudancas = false;

  novosProdutos.forEach((novoProduto) => {
    const produtoAntigo = produtosAntigos.find((p) => p.id === novoProduto.id);

    if (!produtoAntigo) {
      // Produto novo foi adicionado
      mudancas = true
    } else if (produtoAntigo.amount < novoProduto.amount) {
      // Quantidade do produto aumentou
      mudancas = true
    }
  });

  return mudancas;
}

module.exports = { verifyChanges };

