"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";

// Altura máxima do campo antes de aparecer a barra de rolagem (em pixels)
const MAX_TEXTAREA_HEIGHT = 160;

type MessageInputProps = {
  disabled: boolean;
  onSend: (text: string) => void;
};

// Campo de digitação: Enter envia, Shift+Enter quebra linha
export function MessageInput({ disabled, onSend }: MessageInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = !disabled && text.trim().length > 0;

  // Ajusta a altura do campo conforme o texto cresce
  function resizeTextarea() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }

  function submit() {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
    // Espera o React limpar o campo antes de recalcular a altura
    requestAnimationFrame(resizeTextarea);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // isComposing evita enviar no meio de uma acentuação ou digitação com IME
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-slate-200 bg-white px-4 py-3"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <label htmlFor="campo-mensagem" className="sr-only">
          Mensagem
        </label>
        <textarea
          id="campo-mensagem"
          ref={textareaRef}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            resizeTextarea();
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Digite sua mensagem..."
          className="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Enviar
        </button>
      </div>
      <p className="mx-auto mt-1.5 hidden max-w-3xl text-xs text-slate-400 sm:block">
        Enter envia. Shift+Enter quebra a linha.
      </p>
    </form>
  );
}
