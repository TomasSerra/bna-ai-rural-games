// Client-side video trim + watermark using mediabunny's Conversion API.
// WebCodecs-based, works on iOS Safari 16.4+ and Android Chrome — avoids the
// ffmpeg.wasm OOM/Worker issues we hit on iOS.

import {
  BlobSource,
  BufferTarget,
  Conversion,
  Input,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  ALL_FORMATS,
} from 'mediabunny';

interface ProcessOptions {
  trimStartSeconds: number;
  watermarkUrl: string;
}

export function supportsVideoProcessing(): boolean {
  return (
    typeof VideoEncoder !== 'undefined' &&
    typeof VideoDecoder !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined'
  );
}

export async function processVideo(blob: Blob, opts: ProcessOptions): Promise<Blob> {
  const watermark = await loadWatermark(opts.watermarkUrl);

  const input = new Input({
    source: new BlobSource(blob),
    formats: ALL_FORMATS,
  });

  const output = new Output({
    // fastStart 'in-memory' relocates the moov atom to the start of the file,
    // which iOS Safari needs to begin playback before fully downloading.
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target: new BufferTarget(),
  });

  // Lazily allocated when we know the actual track dimensions.
  let canvas: OffscreenCanvas | null = null;
  let ctx: OffscreenCanvasRenderingContext2D | null = null;

  const conversion = await Conversion.init({
    input,
    output,
    trim: { start: opts.trimStartSeconds },
    video: {
      codec: 'avc',
      bitrate: QUALITY_HIGH,
      forceTranscode: true,
      process: (sample) => {
        const w = sample.displayWidth;
        const h = sample.displayHeight;
        if (!canvas || canvas.width !== w || canvas.height !== h) {
          canvas = new OffscreenCanvas(w, h);
          ctx = canvas.getContext('2d');
        }
        if (!ctx) return sample;

        sample.draw(ctx, 0, 0, w, h);

        // Scale watermark to video width, anchored to the bottom.
        const wmScale = w / watermark.width;
        const wmH = watermark.height * wmScale;
        ctx.drawImage(watermark, 0, h - wmH, w, wmH);

        return canvas;
      },
    },
  });

  await conversion.execute();

  const buffer = output.target.buffer;
  if (!buffer) throw new Error('Mediabunny output buffer is empty.');
  return new Blob([buffer], { type: 'video/mp4' });
}

async function loadWatermark(url: string): Promise<ImageBitmap> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`No pude cargar el watermark (${resp.status}).`);
  const blob = await resp.blob();
  return await createImageBitmap(blob);
}
