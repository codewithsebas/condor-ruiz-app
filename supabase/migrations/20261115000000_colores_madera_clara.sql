-- El sitio pasa a la paleta «Madera clara» (src/lib/theme.ts, la primera de THEME_PRESETS). El editor de colores ya no
-- está en el panel, así que los colores guardados (la paleta verde «Bosque») se quitan: con theme vacío el sitio usa los
-- del código. Solo toca la columna de colores; textos, horarios y demás ajustes quedan igual.
update public.site_settings set theme = '{}'::jsonb where theme <> '{}'::jsonb;
