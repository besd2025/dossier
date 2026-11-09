"use client";

import * as React from "react";
import { Plus, Tag, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * @typedef {Object} KeywordInputProps
 * @property {string[]} [keywords=[]] - Liste des mots-clés saisis
 * @property {(newKeywords: string[]) => void} onChange - Callback recevant la liste mise à jour
 * @property {number} [max=10] - Nombre maximum de mots-clés
 * @property {string} [placeholder="Ajouter un mot-clé (ex: Défense, Renseignement, Marché...)"] - Placeholder du champ
 * @property {boolean} [disabled=false] - Désactive la saisie
 * @property {string} [error] - Message d'erreur
 * @property {boolean} [required=true] - Indique si la saisie est obligatoire
 * @property {string} [className] - Classes CSS personnalisées
 */

/**
 * Composant de saisie de mots-clés sous forme de badges.
 * Conforme à la section 4.8 de docs/BESD_structure_interfaces.md :
 * « Mots-clés (obligatoires avant dépôt, saisie par badges). »
 *
 * @param {KeywordInputProps} props
 */
export function KeywordInput({
  keywords = [],
  onChange,
  max = 10,
  placeholder = "Saisir un mot-clé puis Entrée ou Virgule...",
  disabled = false,
  error,
  required = true,
  className,
}) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef(null);

  const addKeyword = (rawWord) => {
    const word = rawWord.trim().replace(/^,+|,+$/g, "");
    if (!word) return;

    if (keywords.includes(word)) {
      setInputValue("");
      return;
    }

    if (keywords.length >= max) {
      return;
    }

    const updated = [...keywords, word];
    onChange?.(updated);
    setInputValue("");
  };

  const removeKeyword = (indexToRemove) => {
    if (disabled) return;
    const updated = keywords.filter((_, idx) => idx !== indexToRemove);
    onChange?.(updated);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword(inputValue);
    } else if (e.key === "Backspace" && !inputValue && keywords.length > 0) {
      removeKeyword(keywords.length - 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    const terms = pasteData
      .split(/[,;\n]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    let updated = [...keywords];
    for (const term of terms) {
      if (!updated.includes(term) && updated.length < max) {
        updated.push(term);
      }
    }
    onChange?.(updated);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <label className="font-medium text-foreground flex items-center gap-1.5">
          <Tag className="size-3.5 text-primary" />
          <span>Mots-clés d&apos;indexation</span>
          {required && (
            <span className="text-destructive font-bold" title="Obligatoire">*</span>
          )}
        </label>
        <span className="text-[11px] text-muted-foreground font-mono">
          {keywords.length} / {max}
        </span>
      </div>

      {/* Conteneur champ + badges intégrés */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "flex flex-wrap items-center gap-1.5 p-2 rounded-lg border border-input bg-background min-h-[42px] cursor-text transition-colors shadow-2xs focus-within:ring-2 focus-within:ring-ring focus-within:border-ring",
          disabled && "opacity-50 cursor-not-allowed bg-muted/40",
          error && "border-destructive focus-within:ring-destructive"
        )}
      >
        {keywords.map((word, index) => (
          <Badge
            key={`${word}-${index}`}
            variant="secondary"
            className="text-xs px-2 py-0.5 h-6 gap-1 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors"
          >
            <span>{word}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeKeyword(index);
                }}
                className="size-3.5 rounded-full inline-flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
                aria-label={`Supprimer le mot-clé ${word}`}
              >
                <X className="size-2.5" />
              </button>
            )}
          </Badge>
        ))}

        {keywords.length < max && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBlur={() => {
              if (inputValue.trim()) addKeyword(inputValue);
            }}
            placeholder={keywords.length === 0 ? placeholder : "Ajouter..."}
            disabled={disabled}
            className="flex-1 min-w-[120px] bg-transparent text-xs outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed"
          />
        )}
      </div>

      {/* Message d'aide ou d'erreur */}
      {error ? (
        <p className="text-[11px] text-destructive font-medium">{error}</p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          {required && keywords.length === 0 ? (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Obligatoire : au moins un mot-clé requis avant de pouvoir déposer ou transmettre une note.
            </span>
          ) : (
            <span>Appuyez sur Entrée ou Virgule pour valider chaque mot-clé.</span>
          )}
        </p>
      )}
    </div>
  );
}

export default KeywordInput;
