/**
 * Fondo con scroll vertical infinito a partir de una TILE repetible.
 *
 * `bg-tile.png` es una tira corta que empalma consigo misma (su borde inferior
 * coincide con el superior). Se escala al ancho del canvas conservando su
 * proporción y se apila tantas veces como haga falta para cubrir el alto,
 * desplazando el stack hacia abajo. Al pasar una altura de tile hace wrap,
 * generando movimiento continuo arriba→abajo.
 *
 * Para cambiar el fondo mañana: reemplazar `bg-tile.png` por otra tira repetible
 * (cualquier resolución sirve, se reescala al ancho).
 */
export class ScrollingBackground {
  private offset = 0;

  constructor(private readonly img: HTMLImageElement) {}

  /**
   * Avanza el scroll.
   * @param distance fracción de alto recorrida en este frame (speed * dt)
   * @param height   alto del canvas en px
   */
  update(distance: number, height: number): void {
    this.offset += distance * height;
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Alto de la tile escalada al ancho del canvas (mantiene proporción).
    const tileH = width * (this.img.height / this.img.width);

    // Acotar el offset a [0, tileH) para evitar pérdida de precisión en sesiones largas.
    this.offset %= tileH;

    // Primera tile arranca apenas por encima del borde superior; +1px de solape
    // entre tiles para que el redondeo subpíxel no abra costuras.
    for (let y = this.offset - tileH; y < height; y += tileH) {
      ctx.drawImage(this.img, 0, Math.round(y), width, Math.ceil(tileH) + 1);
    }
  }
}
