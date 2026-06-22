import { drawCover } from './drawing';

/**
 * Fondo con scroll vertical infinito. Dibuja la misma imagen dos veces apiladas
 * (una encima de la otra) y desplaza el offset hacia abajo; al superar el alto del
 * canvas hace wrap, generando el efecto de movimiento continuo arriba→abajo.
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
    this.offset = (this.offset + distance * height) % height;
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const y = this.offset;
    // Copia que entra desde arriba.
    drawCover(ctx, this.img, { x: 0, y: y - height, w: width, h: height });
    // Copia que sale por abajo.
    drawCover(ctx, this.img, { x: 0, y, w: width, h: height });
  }
}
