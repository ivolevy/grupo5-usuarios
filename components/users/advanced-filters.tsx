"use client"

import { useState, useEffect } from "react"
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
  activityStatus: string
  verificationStatus: string
  nationality: string
  dateRange: {
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
  availableNationalities?: string[]
}

export function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  onReset, 
  isOpen, 
  onToggle,
  activeTab,
  availableNationalities = []
}: AdvancedFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters)
  const [dateError, setDateError] = useState<string>("")

  // Sincronizar filtros locales con los filtros aplicados cuando se abre el panel
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters)
    }
  }, [isOpen, filters])

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    // No aplicar filtros inmediatamente, solo actualizar el estado local
  }

  const handleDateRangeChange = (type: 'from' | 'to', date: Date | undefined) => {
    setDateError("") // Limpiar error al cambiar fecha
    
    if (!date) {
      const newFilters = {
        ...localFilters,
        dateRange: {
          ...localFilters.dateRange,
          [type]: undefined
        }
      }
      setLocalFilters(newFilters)
      return
    }

    // Validar que "Desde" no sea posterior a "Hasta"
    if (type === 'from' && localFilters.dateRange.to) {
      // Si se selecciona una fecha "Desde" posterior a "Hasta", no permitir
      if (date > localFilters.dateRange.to) {
        setDateError("La fecha 'Desde' no puede ser posterior a la fecha 'Hasta'")
        return
      }
    }

    // Validar que "Hasta" no sea anterior a "Desde"
    if (type === 'to' && localFilters.dateRange.from) {
      // Si se selecciona una fecha "Hasta" anterior a "Desde", no permitir
      if (date < localFilters.dateRange.from) {
        setDateError("La fecha 'Hasta' no puede ser anterior a la fecha 'Desde'")
        return
      }
    }

    const newFilters = {
      ...localFilters,
      dateRange: {
        ...localFilters.dateRange,
        [type]: date
      }
    }
    setLocalFilters(newFilters)
    // No aplicar filtros inmediatamente, solo actualizar el estado local
  }

  const applyFilters = () => {
    onFiltersChange(localFilters)
    onToggle() // Cerrar el panel de filtros después de aplicar
  }

  const resetFilters = () => {
    const resetFilters = {
      role: "all",
      activityStatus: "all",
      verificationStatus: "all",
      nationality: "all",
      dateRange: { from: undefined, to: undefined },
      searchTerm: ""
    }
    setLocalFilters(resetFilters)
  }

  const resetAndApply = () => {
    const resetFilters = {
      role: "all",
      activityStatus: "all",
      verificationStatus: "all",
      nationality: "all",
      dateRange: { from: undefined, to: undefined },
      searchTerm: ""
    }
    setLocalFilters(resetFilters)
    onReset()
    onToggle() // Cerrar el panel de filtros después de limpiar
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.role && filters.role !== "all") count++
    if (filters.activityStatus && filters.activityStatus !== "all") count++
    if (filters.nationality && filters.nationality !== "all") count++
    if (filters.verificationStatus && filters.verificationStatus !== "all") count++
    if (filters.dateRange.from || filters.dateRange.to) count++
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
                  onClick={resetAndApply}
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
            {/* Filtro por rol - Siempre visible para todos los tipos de usuarios */}
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
                  <SelectItem value="interno">Usuario Interno</SelectItem>
                  <SelectItem value="usuario">Usuario</SelectItem>
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
                  {availableNationalities.map((nationality) => (
                    <SelectItem key={nationality} value={nationality}>
                      {nationality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por actividad - Siempre visible para todos los tipos de usuarios */}
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

            {/* Filtro por verificación - Siempre visible para todos los tipos de usuarios */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Estado de verificación</Label>
              <Select
                value={localFilters.verificationStatus}
                onValueChange={(value) => handleFilterChange('verificationStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="verified">Solo verificados</SelectItem>
                  <SelectItem value="unverified">Solo no verificados</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                        disabled={(date) => {
                          // Deshabilitar fechas posteriores a "Hasta" si existe
                          if (localFilters.dateRange.to) {
                            return date > localFilters.dateRange.to
                          }
                          return false
                        }}
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
                        disabled={(date) => {
                          // Deshabilitar fechas anteriores a "Desde" si existe
                          if (localFilters.dateRange.from) {
                            return date < localFilters.dateRange.from
                          }
                          return false
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {dateError && (
                <p className="text-xs text-red-600 mt-1">{dateError}</p>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 pt-2">
              <Button onClick={applyFilters} className="flex-1">
                Aplicar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
