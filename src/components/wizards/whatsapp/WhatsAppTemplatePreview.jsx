import React, { useMemo } from 'react';
import WhatsAppPreview from '../../WhatsAppPreview';

// Normaliza distintos formatos de entrada a la estructura { header, body, footer, buttons }
const normalizeComponents = (raw, previewContent) => {
  if (!raw) return null;

  // If raw is a string (possibly JSON encoded), try to parse
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      raw = parsed?.components || parsed; // allow structure {components: {...}}
    } catch {
      // Fallback: treat entire raw as body text
      return { body: { text: previewContent || raw }, buttons: [] };
    }
  }

  // Si viene como array (formato posible de Meta), mapear por type
  if (Array.isArray(raw)) {
    const acc = {};
    raw.forEach(comp => {
      const type = (comp.type || comp.format || '').toLowerCase();
      if (type === 'header') {
        acc.header = {
          format: comp.format || comp.header_type || comp.format_type || 'TEXT',
          text: comp.text || comp.example?.header_text?.[0] || '',
          url: comp.url,
          file_name: comp.file_name,
          localPreviewUrl: comp.localPreviewUrl
        };
      } else if (type === 'body') {
        acc.body = { text: previewContent || comp.text || '' };
      } else if (type === 'footer') {
        acc.footer = { text: comp.text || '' };
      } else if (type === 'buttons') {
        acc.buttons = comp.buttons || [];
      } else if (comp.type === 'BUTTONS') {
        acc.buttons = comp.buttons || [];
      }
    });
    return acc;
  }

  // Si ya es objeto con body/header directo
  const header = raw.header ? { ...raw.header } : undefined;
  const body = raw.body ? { text: previewContent || raw.body.text } : (previewContent ? { text: previewContent } : undefined);
  const footer = raw.footer ? { ...raw.footer } : undefined;
  const buttons = raw.buttons || [];
  const result = { header, body, footer, buttons };

  // Provide a mock if body still empty
  if (!result.body) {
    result.body = { text: previewContent || 'Cuerpo de la plantilla (sin contenido definido)' };
  }
  return result;
};

const highlightVariables = (components) => {
  if (!components?.body?.text) return components;
  const newBody = { ...components.body };
  newBody.text = newBody.text.replace(/\{\{(\d+)\}\}/g, (_m, g1) => `{{${g1}}}`);
  return { ...components, body: newBody };
};

const WhatsAppTemplatePreview = ({ template, components: comps, previewContent }) => {
  // Prioridad: template.components > props.comps > fallback desde template.content
  const raw = template?.components || comps || (template?.content ? { body: { text: previewContent || template.content } } : null);

  const normalized = useMemo(() => highlightVariables(normalizeComponents(raw, previewContent)), [raw, previewContent]);

  return (
    <div className="sticky top-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Vista Previa de la Plantilla</h3>
      {normalized ? (
        <WhatsAppPreview components={normalized} />
      ) : (
        <div className="text-sm text-gray-500">No hay datos para previsualizar.</div>
      )}
    </div>
  );
};

export default WhatsAppTemplatePreview;