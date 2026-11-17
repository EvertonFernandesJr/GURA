# GURA
GURA - Grade Universitaria e Review Academico. Sera um software para auxiliar os alunos de universidades a montarem suas grades e darem review a seus professores ajudando os proximos alunos a terem uma nocao dos melhores horarios e professores da universidade


## Desenvolvimento

```bash
npm ci
npm run dev
npm run build
npm run preview
```

O projeto utiliza `navbar.html` como componente compartilhado e `public/professores.json` como fonte comum da grade e das avaliações. As notícias são carregadas de `public/noticias.json`.

Para publicação, copie `sitemap.example.xml` para `public/sitemap.xml` e substitua o domínio de exemplo pelo domínio real (incluindo o subdiretório, se houver). Atualize `public/robots.txt` e as URLs de `og:image` para URLs absolutas do site publicado. As páginas internas mantêm `noindex`.

As avaliações e autenticação usam armazenamento local do navegador; não constituem um backend de produção.

### Avaliações
Cada conta local pode salvar uma avaliação por registro de professor/matéria. Reenviar substitui a anterior; limpar remove imediatamente. As médias são recalculadas por critério, ignorando estrelas não selecionadas. Como o JSON não contém contagem de votos, cada média original é uma referência de peso 1. Para médias reais compartilhadas entre dispositivos, é necessário um backend com contagem e armazenamento de votos. Avaliações antigas sem autor são importadas uma vez para a conta ativa.
