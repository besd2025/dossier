"use client";

import { Settings } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PREFERENCE_REGISTRY } from "@/lib/preferences/preferences-config";
import { THEME_PRESET_OPTIONS } from "@/lib/preferences/theme";
import {
  CONTENT_LAYOUT_OPTIONS,
  NAVBAR_STYLE_OPTIONS,
  SIDEBAR_COLLAPSIBLE_OPTIONS,
  SIDEBAR_VARIANT_OPTIONS,
} from "@/lib/preferences/layout";
import { THEME_MODE_OPTIONS } from "@/lib/preferences/theme";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

export function LayoutControls() {
  const { values, setPreference, resetPreferences } = usePreferencesStore(
    useShallow((state) => ({
      values: state.values,
      setPreference: state.setPreference,
      resetPreferences: state.resetPreferences,
    })),
  );

  const {
    theme_mode: themeMode,
    theme_preset: themePreset,
    content_layout: contentLayout,
    navbar_style: navbarStyle,
    sidebar_variant: variant,
    sidebar_collapsible: collapsible,
  } = values;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title="Préférences d'affichage">
          <Settings className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold leading-none">Préférences d&apos;affichage</h4>
            <p className="text-muted-foreground text-xs">
              Personnalisez l&apos;apparence et la disposition de l&apos;interface BESD.
            </p>
          </div>

          <div className="space-y-3">
            {/* Préréglage de thème */}
            <div className="space-y-1">
              <Label className="text-xs">Palette de couleurs</Label>
              <Select
                value={themePreset}
                onValueChange={(val) => setPreference("theme_preset", val)}
              >
                <SelectTrigger size="sm" className="w-full text-xs">
                  <SelectValue placeholder="Preset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {THEME_PRESET_OPTIONS.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Mode Sombre / Clair */}
            <div className="space-y-1">
              <Label className="text-xs">Mode de thème</Label>
              <div className="grid grid-cols-3 gap-1">
                {THEME_MODE_OPTIONS.map((mode) => (
                  <Button
                    key={mode.value}
                    variant={themeMode === mode.value ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setPreference("theme_mode", mode.value)}
                  >
                    {mode.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Largeur du contenu */}
            <div className="space-y-1">
              <Label className="text-xs">Largeur du contenu</Label>
              <div className="grid grid-cols-2 gap-1">
                {CONTENT_LAYOUT_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={contentLayout === opt.value ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setPreference("content_layout", opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Style de la barre de navigation */}
            <div className="space-y-1">
              <Label className="text-xs">En-tête (Navbar)</Label>
              <div className="grid grid-cols-2 gap-1">
                {NAVBAR_STYLE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={navbarStyle === opt.value ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setPreference("navbar_style", opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Style de sidebar */}
            <div className="space-y-1">
              <Label className="text-xs">Style de sidebar</Label>
              <div className="grid grid-cols-3 gap-1">
                {SIDEBAR_VARIANT_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={variant === opt.value ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setPreference("sidebar_variant", opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Mode replié */}
            <div className="space-y-1">
              <Label className="text-xs">Mode replié</Label>
              <div className="grid grid-cols-2 gap-1">
                {SIDEBAR_COLLAPSIBLE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={collapsible === opt.value ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setPreference("sidebar_collapsible", opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground w-full mt-1"
            onClick={resetPreferences}
          >
            Réinitialiser les préférences
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
