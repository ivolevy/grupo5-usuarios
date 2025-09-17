"use client"

import { AlertTriangle, Shield, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface AccessDeniedProps {
  title?: string
  description?: string
  showBackButton?: boolean
}

export function AccessDenied({ 
  title = "Acceso Denegado", 
  description = "No tienes permisos para acceder a esta sección.",
  showBackButton = true 
}: AccessDeniedProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-xl font-roboto-bold text-dark-gray">{title}</CardTitle>
          <CardDescription className="text-gray-600 font-roboto-regular">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6 font-roboto-regular">
            <AlertTriangle className="w-4 h-4" />
            <span>Contacta a un administrador si necesitas acceso</span>
          </div>
          {showBackButton && (
            <Link href="/dashboard">
              <Button className="w-full font-roboto-medium">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Dashboard
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
