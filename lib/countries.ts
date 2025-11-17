import i18nIsoCountries from "i18n-iso-countries"
import es from "i18n-iso-countries/langs/es.json"

// Registrar el idioma español
i18nIsoCountries.registerLocale(es)

// Obtener todos los países en español
const countriesObject = i18nIsoCountries.getNames("es", { select: "official" })

// Convertir a array y ordenar alfabéticamente
export const countries = Object.entries(countriesObject)
  .map(([code, name]) => ({
    code,
    name
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "es"))
