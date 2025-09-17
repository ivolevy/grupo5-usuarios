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
            {/* Filtro por rol - Solo para administradores y moderadores */}
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
                    <SelectItem value="moderador">Moderador</SelectItem>
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
