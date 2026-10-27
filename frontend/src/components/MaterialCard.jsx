import { useState } from 'react';
import { Copy, ExternalLink, FileText, Film, Image, MessageCircle, Presentation } from 'lucide-react';
import { TIPOS_MATERIAL, ligaMaterial } from '../api/ventas';

const ICONO = { logo: Image, imagen: Image, presentacion: Presentation, video: Film, documento: FileText, otro: FileText };
const esImagen = (liga) => /\.(svg|png|jpe?g|webp)$/i.test(liga);

// Tarjeta de material; si recibe `whatsapp` (liga wa.me del lead) agrega botón para mandarlo
export default function MaterialCard({ m, whatsapp, onEditar }) {
  const [copiado, setCopiado] = useState(false);
  const liga = ligaMaterial(m);
  const Icono = ICONO[m.tipo] || FileText;

  async function copiar() {
    await navigator.clipboard.writeText(liga);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden flex flex-col" style={{ borderColor: 'var(--color-sage)' }}>
      {/* Fondo claro para imágenes: hay logos con texto oscuro */}
      <div className={`h-28 flex items-center justify-center ${esImagen(liga) ? 'bg-zinc-200' : ''}`}
           style={esImagen(liga) ? undefined : { backgroundColor: 'var(--color-primary)' }}>
        {esImagen(liga)
          ? <img src={liga} alt="" className="max-h-20 max-w-[80%] object-contain" />
          : <Icono className="w-10 h-10" style={{ color: 'var(--color-violet)' }} strokeWidth={1.5} />}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="font-medium text-sm">{m.titulo}</p>
        <p className="font-mono text-[11px] opacity-60">
          {TIPOS_MATERIAL[m.tipo]}{m.modulo_nombre ? ` · ${m.modulo_nombre}` : ''}
        </p>
        {m.notas && <p className="text-xs opacity-70 mt-1">{m.notas}</p>}
        <div className="flex gap-1 mt-auto pt-3 text-xs">
          <a href={liga} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2 py-1 rounded border" style={{ borderColor: 'var(--color-sage)' }}>
            <ExternalLink className="w-3.5 h-3.5" /> Abrir
          </a>
          <button onClick={copiar} className="flex items-center gap-1 px-2 py-1 rounded border" style={{ borderColor: 'var(--color-sage)' }}>
            <Copy className="w-3.5 h-3.5" /> {copiado ? 'Copiada' : 'Liga'}
          </button>
          {whatsapp && (
            <a href={`${whatsapp}?text=${encodeURIComponent(`${m.titulo}: ${liga}`)}`} target="_blank" rel="noreferrer"
               className="flex items-center gap-1 px-2 py-1 rounded border" style={{ borderColor: 'var(--color-sage)' }}>
              <MessageCircle className="w-3.5 h-3.5" /> Enviar
            </a>
          )}
          {onEditar && <button onClick={() => onEditar(m)} className="ml-auto px-2 py-1 opacity-70 hover:opacity-100">Editar</button>}
        </div>
      </div>
    </div>
  );
}
