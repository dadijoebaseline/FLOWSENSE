import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getStatusBadgeClass(status) {
  const normalized = (status ?? '').toString().trim().toLowerCase();
  if (normalized === 'active') {
    return 'text-emerald-400';
  }
  if (normalized === 'disconnected') {
    return 'text-red-400';
  }
  return 'text-amber-400';
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char];
  });
}

export function getStatusBadgeHtml(status) {
  const label = (status ?? 'N/A').toString().trim().toUpperCase() || 'N/A';
  return `<span class="${getStatusBadgeClass(status)}">${escapeHtml(label)}</span>`;
}

export const isIframe = window.self !== window.top;
