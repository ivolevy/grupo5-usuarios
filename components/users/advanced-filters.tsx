"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Filter, X, RotateCcw } from "lucide-react"
// import { format } from "date-fns"
// import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

export interface FilterOptions {
  role: string
  verificationStatus: string
  activityStatus: string
  nationality: string
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
  lastLoginRange: {
    from: Date | undefined
    to: Date | undefined
  }
  searchTerm: string
}

interface AdvancedFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  onReset: () => void
  isOpen: boolean
  onToggle: () => void
  activeTab: string
}

export function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  onReset, 
  isOpen, 
  onToggle,
  activeTab
}: AdvancedFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters)

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleDateRangeChange = (type: 'from' | 'to', date: Date | undefined) => {
    const newFilters = {
      ...localFilters,
      dateRange: {
        ...localFilters.dateRange,
        [type]: date
      }
    }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleLastLoginRangeChange = (type: 'from' | 'to', date: Date | undefined) => {
    const newFilters = {
      ...localFilters,
      lastLoginRange: {
        ...localFilters.lastLoginRange,
        [type]: date
      }
    }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const applyFilters = () => {
    onFiltersChange(localFilters)
  }

  const resetFilters = () => {
    const resetFilters = {
      role: "all",
      verificationStatus: "all",
      activityStatus: "all",
      nationality: "all",
      dateRange: { from: undefined, to: undefined },
      lastLoginRange: { from: undefined, to: undefined },
      searchTerm: ""
    }
    setLocalFilters(resetFilters)
    onReset()
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.role && filters.role !== "all") count++
    if (filters.verificationStatus && filters.verificationStatus !== "all") count++
    if (filters.activityStatus && filters.activityStatus !== "all") count++
    if (filters.nationality && filters.nationality !== "all") count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    if (filters.lastLoginRange.from || filters.lastLoginRange.to) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={onToggle}
        className="flex items-center gap-2"
      >
        <Filter className="w-4 h-4" />
        Filtros
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="ml-1">
            {activeFiltersCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute top-12 right-0 w-96 z-50 shadow-lg border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Filtros Avanzados</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-8 px-2"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="h-8 px-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtro por rol - Solo para administradores e internos */}
            {activeTab === "admin-moderator" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Rol</Label>
                <Select
                  value={localFilters.role}
                  onValueChange={(value) => handleFilterChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="interno">Interno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Filtro por estado de verificación */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Estado de Verificación</Label>
              <Select
                value={localFilters.verificationStatus}
                onValueChange={(value) => handleFilterChange('verificationStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="verified">Verificado</SelectItem>
                  <SelectItem value="unverified">Sin verificar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por nacionalidad */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nacionalidad</Label>
              <Select
                value={localFilters.nationality}
                onValueChange={(value) => handleFilterChange('nationality', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las nacionalidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las nacionalidades</SelectItem>
                  <SelectItem value="Sin especificar">Sin especificar</SelectItem>
                  <SelectItem value="Afganistán">Afganistán</SelectItem>
                  <SelectItem value="Albania">Albania</SelectItem>
                  <SelectItem value="Alemania">Alemania</SelectItem>
                  <SelectItem value="Andorra">Andorra</SelectItem>
                  <SelectItem value="Angola">Angola</SelectItem>
                  <SelectItem value="Arabia Saudita">Arabia Saudita</SelectItem>
                  <SelectItem value="Argelia">Argelia</SelectItem>
                  <SelectItem value="Argentina">Argentina</SelectItem>
                  <SelectItem value="Armenia">Armenia</SelectItem>
                  <SelectItem value="Australia">Australia</SelectItem>
                  <SelectItem value="Austria">Austria</SelectItem>
                  <SelectItem value="Azerbaiyán">Azerbaiyán</SelectItem>
                  <SelectItem value="Bahamas">Bahamas</SelectItem>
                  <SelectItem value="Bangladés">Bangladés</SelectItem>
                  <SelectItem value="Barbados">Barbados</SelectItem>
                  <SelectItem value="Bélgica">Bélgica</SelectItem>
                  <SelectItem value="Belice">Belice</SelectItem>
                  <SelectItem value="Benín">Benín</SelectItem>
                  <SelectItem value="Bielorrusia">Bielorrusia</SelectItem>
                  <SelectItem value="Bolivia">Bolivia</SelectItem>
                  <SelectItem value="Bosnia y Herzegovina">Bosnia y Herzegovina</SelectItem>
                  <SelectItem value="Botsuana">Botsuana</SelectItem>
                  <SelectItem value="Brasil">Brasil</SelectItem>
                  <SelectItem value="Brunéi">Brunéi</SelectItem>
                  <SelectItem value="Bulgaria">Bulgaria</SelectItem>
                  <SelectItem value="Burkina Faso">Burkina Faso</SelectItem>
                  <SelectItem value="Burundi">Burundi</SelectItem>
                  <SelectItem value="Cabo Verde">Cabo Verde</SelectItem>
                  <SelectItem value="Camboya">Camboya</SelectItem>
                  <SelectItem value="Camerún">Camerún</SelectItem>
                  <SelectItem value="Canadá">Canadá</SelectItem>
                  <SelectItem value="Catar">Catar</SelectItem>
                  <SelectItem value="Chad">Chad</SelectItem>
                  <SelectItem value="Chile">Chile</SelectItem>
                  <SelectItem value="China">China</SelectItem>
                  <SelectItem value="Chipre">Chipre</SelectItem>
                  <SelectItem value="Colombia">Colombia</SelectItem>
                  <SelectItem value="Comoras">Comoras</SelectItem>
                  <SelectItem value="Congo">Congo</SelectItem>
                  <SelectItem value="Corea del Norte">Corea del Norte</SelectItem>
                  <SelectItem value="Corea del Sur">Corea del Sur</SelectItem>
                  <SelectItem value="Costa Rica">Costa Rica</SelectItem>
                  <SelectItem value="Croacia">Croacia</SelectItem>
                  <SelectItem value="Cuba">Cuba</SelectItem>
                  <SelectItem value="Dinamarca">Dinamarca</SelectItem>
                  <SelectItem value="Dominica">Dominica</SelectItem>
                  <SelectItem value="Ecuador">Ecuador</SelectItem>
                  <SelectItem value="Egipto">Egipto</SelectItem>
                  <SelectItem value="El Salvador">El Salvador</SelectItem>
                  <SelectItem value="Emiratos Árabes Unidos">Emiratos Árabes Unidos</SelectItem>
                  <SelectItem value="Eritrea">Eritrea</SelectItem>
                  <SelectItem value="Eslovaquia">Eslovaquia</SelectItem>
                  <SelectItem value="Eslovenia">Eslovenia</SelectItem>
                  <SelectItem value="España">España</SelectItem>
                  <SelectItem value="Estados Unidos">Estados Unidos</SelectItem>
                  <SelectItem value="Estonia">Estonia</SelectItem>
                  <SelectItem value="Etiopía">Etiopía</SelectItem>
                  <SelectItem value="Filipinas">Filipinas</SelectItem>
                  <SelectItem value="Finlandia">Finlandia</SelectItem>
                  <SelectItem value="Fiyi">Fiyi</SelectItem>
                  <SelectItem value="Francia">Francia</SelectItem>
                  <SelectItem value="Gabón">Gabón</SelectItem>
                  <SelectItem value="Gambia">Gambia</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Ghana">Ghana</SelectItem>
                  <SelectItem value="Granada">Granada</SelectItem>
                  <SelectItem value="Grecia">Grecia</SelectItem>
                  <SelectItem value="Guatemala">Guatemala</SelectItem>
                  <SelectItem value="Guinea">Guinea</SelectItem>
                  <SelectItem value="Guinea-Bisáu">Guinea-Bisáu</SelectItem>
                  <SelectItem value="Guyana">Guyana</SelectItem>
                  <SelectItem value="Haití">Haití</SelectItem>
                  <SelectItem value="Honduras">Honduras</SelectItem>
                  <SelectItem value="Hungría">Hungría</SelectItem>
                  <SelectItem value="India">India</SelectItem>
                  <SelectItem value="Indonesia">Indonesia</SelectItem>
                  <SelectItem value="Irak">Irak</SelectItem>
                  <SelectItem value="Irán">Irán</SelectItem>
                  <SelectItem value="Irlanda">Irlanda</SelectItem>
                  <SelectItem value="Islandia">Islandia</SelectItem>
                  <SelectItem value="Israel">Israel</SelectItem>
                  <SelectItem value="Italia">Italia</SelectItem>
                  <SelectItem value="Jamaica">Jamaica</SelectItem>
                  <SelectItem value="Japón">Japón</SelectItem>
                  <SelectItem value="Jordania">Jordania</SelectItem>
                  <SelectItem value="Kazajistán">Kazajistán</SelectItem>
                  <SelectItem value="Kenia">Kenia</SelectItem>
                  <SelectItem value="Kirguistán">Kirguistán</SelectItem>
                  <SelectItem value="Kiribati">Kiribati</SelectItem>
                  <SelectItem value="Kuwait">Kuwait</SelectItem>
                  <SelectItem value="Laos">Laos</SelectItem>
                  <SelectItem value="Lesoto">Lesoto</SelectItem>
                  <SelectItem value="Letonia">Letonia</SelectItem>
                  <SelectItem value="Líbano">Líbano</SelectItem>
                  <SelectItem value="Liberia">Liberia</SelectItem>
                  <SelectItem value="Libia">Libia</SelectItem>
                  <SelectItem value="Liechtenstein">Liechtenstein</SelectItem>
                  <SelectItem value="Lituania">Lituania</SelectItem>
                  <SelectItem value="Luxemburgo">Luxemburgo</SelectItem>
                  <SelectItem value="Madagascar">Madagascar</SelectItem>
                  <SelectItem value="Malasia">Malasia</SelectItem>
                  <SelectItem value="Malaui">Malaui</SelectItem>
                  <SelectItem value="Maldivas">Maldivas</SelectItem>
                  <SelectItem value="Malí">Malí</SelectItem>
                  <SelectItem value="Malta">Malta</SelectItem>
                  <SelectItem value="Marruecos">Marruecos</SelectItem>
                  <SelectItem value="Mauricio">Mauricio</SelectItem>
                  <SelectItem value="Mauritania">Mauritania</SelectItem>
                  <SelectItem value="México">México</SelectItem>
                  <SelectItem value="Micronesia">Micronesia</SelectItem>
                  <SelectItem value="Moldavia">Moldavia</SelectItem>
                  <SelectItem value="Mónaco">Mónaco</SelectItem>
                  <SelectItem value="Mongolia">Mongolia</SelectItem>
                  <SelectItem value="Montenegro">Montenegro</SelectItem>
                  <SelectItem value="Mozambique">Mozambique</SelectItem>
                  <SelectItem value="Myanmar">Myanmar</SelectItem>
                  <SelectItem value="Namibia">Namibia</SelectItem>
                  <SelectItem value="Nauru">Nauru</SelectItem>
                  <SelectItem value="Nepal">Nepal</SelectItem>
                  <SelectItem value="Nicaragua">Nicaragua</SelectItem>
                  <SelectItem value="Níger">Níger</SelectItem>
                  <SelectItem value="Nigeria">Nigeria</SelectItem>
                  <SelectItem value="Noruega">Noruega</SelectItem>
                  <SelectItem value="Nueva Zelanda">Nueva Zelanda</SelectItem>
                  <SelectItem value="Omán">Omán</SelectItem>
                  <SelectItem value="Países Bajos">Países Bajos</SelectItem>
                  <SelectItem value="Pakistán">Pakistán</SelectItem>
                  <SelectItem value="Palaos">Palaos</SelectItem>
                  <SelectItem value="Panamá">Panamá</SelectItem>
                  <SelectItem value="Papúa Nueva Guinea">Papúa Nueva Guinea</SelectItem>
                  <SelectItem value="Paraguay">Paraguay</SelectItem>
                  <SelectItem value="Perú">Perú</SelectItem>
                  <SelectItem value="Polonia">Polonia</SelectItem>
                  <SelectItem value="Portugal">Portugal</SelectItem>
                  <SelectItem value="Reino Unido">Reino Unido</SelectItem>
                  <SelectItem value="República Centroafricana">República Centroafricana</SelectItem>
                  <SelectItem value="República Checa">República Checa</SelectItem>
                  <SelectItem value="República del Congo">República del Congo</SelectItem>
                  <SelectItem value="República Democrática del Congo">República Democrática del Congo</SelectItem>
                  <SelectItem value="República Dominicana">República Dominicana</SelectItem>
                  <SelectItem value="Ruanda">Ruanda</SelectItem>
                  <SelectItem value="Rumania">Rumania</SelectItem>
                  <SelectItem value="Rusia">Rusia</SelectItem>
                  <SelectItem value="Samoa">Samoa</SelectItem>
                  <SelectItem value="San Cristóbal y Nieves">San Cristóbal y Nieves</SelectItem>
                  <SelectItem value="San Marino">San Marino</SelectItem>
                  <SelectItem value="San Vicente y las Granadinas">San Vicente y las Granadinas</SelectItem>
                  <SelectItem value="Santa Lucía">Santa Lucía</SelectItem>
                  <SelectItem value="Santo Tomé y Príncipe">Santo Tomé y Príncipe</SelectItem>
                  <SelectItem value="Senegal">Senegal</SelectItem>
                  <SelectItem value="Serbia">Serbia</SelectItem>
                  <SelectItem value="Seychelles">Seychelles</SelectItem>
                  <SelectItem value="Sierra Leona">Sierra Leona</SelectItem>
                  <SelectItem value="Singapur">Singapur</SelectItem>
                  <SelectItem value="Siria">Siria</SelectItem>
                  <SelectItem value="Somalia">Somalia</SelectItem>
                  <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                  <SelectItem value="Suazilandia">Suazilandia</SelectItem>
                  <SelectItem value="Sudáfrica">Sudáfrica</SelectItem>
                  <SelectItem value="Sudán">Sudán</SelectItem>
                  <SelectItem value="Sudán del Sur">Sudán del Sur</SelectItem>
                  <SelectItem value="Suecia">Suecia</SelectItem>
                  <SelectItem value="Suiza">Suiza</SelectItem>
                  <SelectItem value="Surinam">Surinam</SelectItem>
                  <SelectItem value="Tailandia">Tailandia</SelectItem>
                  <SelectItem value="Tanzania">Tanzania</SelectItem>
                  <SelectItem value="Tayikistán">Tayikistán</SelectItem>
                  <SelectItem value="Timor Oriental">Timor Oriental</SelectItem>
                  <SelectItem value="Togo">Togo</SelectItem>
                  <SelectItem value="Tonga">Tonga</SelectItem>
                  <SelectItem value="Trinidad y Tobago">Trinidad y Tobago</SelectItem>
                  <SelectItem value="Túnez">Túnez</SelectItem>
                  <SelectItem value="Turkmenistán">Turkmenistán</SelectItem>
                  <SelectItem value="Turquía">Turquía</SelectItem>
                  <SelectItem value="Tuvalu">Tuvalu</SelectItem>
                  <SelectItem value="Ucrania">Ucrania</SelectItem>
                  <SelectItem value="Uganda">Uganda</SelectItem>
                  <SelectItem value="Uruguay">Uruguay</SelectItem>
                  <SelectItem value="Uzbekistán">Uzbekistán</SelectItem>
                  <SelectItem value="Vanuatu">Vanuatu</SelectItem>
                  <SelectItem value="Vaticano">Vaticano</SelectItem>
                  <SelectItem value="Venezuela">Venezuela</SelectItem>
                  <SelectItem value="Vietnam">Vietnam</SelectItem>
                  <SelectItem value="Yemen">Yemen</SelectItem>
                  <SelectItem value="Yibuti">Yibuti</SelectItem>
                  <SelectItem value="Zambia">Zambia</SelectItem>
                  <SelectItem value="Zimbabue">Zimbabue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por actividad - Solo para usuarios normales */}
            {activeTab === "normal-users" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Actividad</Label>
                <Select
                  value={localFilters.activityStatus}
                  onValueChange={(value) => handleFilterChange('activityStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toda la actividad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toda la actividad</SelectItem>
                    <SelectItem value="active">Activos (último login &lt; 30 días)</SelectItem>
                    <SelectItem value="inactive">Inactivos (último login &gt; 30 días)</SelectItem>
                    <SelectItem value="never">Nunca han iniciado sesión</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Filtro por fecha de creación */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Fecha de Creación</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-500">Desde</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !localFilters.dateRange.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.dateRange.from ? (
                          localFilters.dateRange.from.toLocaleDateString('es-ES')
                        ) : (
                          "Seleccionar"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={localFilters.dateRange.from}
                        onSelect={(date) => handleDateRangeChange('from', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Hasta</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !localFilters.dateRange.to && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.dateRange.to ? (
                          localFilters.dateRange.to.toLocaleDateString('es-ES')
                        ) : (
                          "Seleccionar"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={localFilters.dateRange.to}
                        onSelect={(date) => handleDateRangeChange('to', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Filtro por último login */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Último Login</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-500">Desde</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !localFilters.lastLoginRange.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.lastLoginRange.from ? (
                          localFilters.lastLoginRange.from.toLocaleDateString('es-ES')
                        ) : (
                          "Seleccionar"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={localFilters.lastLoginRange.from}
                        onSelect={(date) => handleLastLoginRangeChange('from', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Hasta</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !localFilters.lastLoginRange.to && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.lastLoginRange.to ? (
                          localFilters.lastLoginRange.to.toLocaleDateString('es-ES')
                        ) : (
                          "Seleccionar"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={localFilters.lastLoginRange.to}
                        onSelect={(date) => handleLastLoginRangeChange('to', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 pt-2">
              <Button onClick={applyFilters} className="flex-1">
                Aplicar Filtros
              </Button>
              <Button variant="outline" onClick={resetFilters}>
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
