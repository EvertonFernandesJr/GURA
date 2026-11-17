document.addEventListener("DOMContentLoaded", async () => {
  const newsBox = document.querySelector(".news-box");
  if (!newsBox) return;

  const contentBoxes = newsBox.querySelectorAll(".content-box");
  if (contentBoxes.length === 0) return;

  // Cria dinamicamente o modal na página para exibir a notícia inteira
  let modal = document.getElementById("newsModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "newsModal";
    modal.style.cssText = `
      display: none; position: fixed; z-index: 1000; left: 0; top: 0;
      width: 100%; height: 100%; background-color: rgba(0,0,0,0.5);
      justify-content: center; align-items: center; padding: 20px;
    `;
    modal.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 12px; max-width: 600px; width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.15); position: relative; max-height: 80vh; overflow-y: auto;">
        <button id="closeNewsModal" style="position: absolute; right: 16px; top: 16px; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b;">✕</button>
        <h2 id="modalTitle" style="font-size: 1.2rem; color: #0f172a; margin-bottom: 8px;"></h2>
        <small id="modalMeta" style="color: #64748b; display: block; margin-bottom: 16px; font-size: 0.8rem;"></small>
        <p id="modalBody" style="color: #475569; font-size: 0.95rem; line-height: 1.5;"></p>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("closeNewsModal").addEventListener("click", () => {
      modal.style.display = "none";
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
    });
  }

  try {
    let response = await fetch('/noticias.json').catch(() => null);
    if (!response || !response.ok) {
      response = await fetch('./noticias.json').catch(() => null);
    }
    if (!response || !response.ok) {
      response = await fetch('/public/noticias.json').catch(() => null);
    }

    if (!response || !response.ok) {
      throw new Error("Não foi possível encontrar o arquivo noticias.json");
    }

    const data = await response.json();
    if (!data.noticias || data.noticias.length === 0) return;

    // Pega as 3 notícias mais recentes ordenadas por data
    const noticiasRecentes = data.noticias
      .sort((a, b) => new Date(b.data_envio) - new Date(a.data_envio))
      .slice(0, 3);

    noticiasRecentes.forEach((noticia, index) => {
      if (contentBoxes[index]) {
        const box = contentBoxes[index];
        
        const dataFormatada = new Date(noticia.data_envio).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

        // Aumentado o limite de caracteres para exibir mais texto no card (ex: 220 caracteres)
        const limiteCaracteres = 220;
        let corpoTexto = noticia.corpo;
        let botaoLerMais = '';

        if (corpoTexto.length > limiteCaracteres) {
          corpoTexto = corpoTexto.substring(0, limiteCaracteres) + '...';
          botaoLerMais = ` <a href="#" class="btn-ler-mais" data-id="${noticia.id}">Ler mais</a>`;
        }

        box.innerHTML = `
          <div class="news-header">
            <h3>${noticia.titulo}</h3>
            <span class="news-date">${dataFormatada}</span>
          </div>
          <p class="news-text">${corpoTexto}${botaoLerMais}</p>
          <span class="news-author">${noticia.autor}</span>
        `;

        // Ativa o botão "Ler mais" para abrir o modal com o texto completo
        const btn = box.querySelector(".btn-ler-mais");
        if (btn) {
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            document.getElementById("modalTitle").innerText = noticia.titulo;
            document.getElementById("modalMeta").innerText = `${dataFormatada} - ${noticia.autor}`;
            document.getElementById("modalBody").innerText = noticia.corpo;
            modal.style.display = "flex";
          });
        }
      }
    });
  } catch (error) {
    console.error("Erro ao carregar as notícias:", error);
  }
});