import React, { useState, useEffect } from "react";
import { SensorAnalytics, AnalysisStatus, AnalysisType, ProgressStep } from "@/types/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trash2, AlertCircle, TrendingUp, AlertTriangle, LineChart, ChevronDown, 
  ChevronUp, FileText, Lightbulb, List, Thermometer, Droplet, Flower, 
  Sun, Cpu, Clock, CalendarRange, BarChart4, CheckCircle2, XCircle, LoaderCircle
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AnalyticsResultsProps {
  analytics: SensorAnalytics;
  sensorName: string;
  onDelete: (id: string) => void;
  isExpanded?: boolean;
}

// Verwende React.memo, um unnötige Re-Renderings zu vermeiden
export const AnalyticsResults = React.memo(
  ({ analytics, sensorName, onDelete, isExpanded = false }: AnalyticsResultsProps) => {
    const [isOpen, setIsOpen] = useState(isExpanded);
    const [isDetailedAnalysisOpen, setIsDetailedAnalysisOpen] = useState(false);
    const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(true);
    
    // Persistenter Zustand für die ausgeklappten Fortschrittsinformationen mit localStorage
    const storageKey = `analytics-steps-expanded-${analytics.analytics_id}`;
    
    // Initial den Wert aus localStorage lesen oder auf false zurückfallen
    const [stepsExpanded, setStepsExpanded] = useState(() => {
      try {
        const storedValue = localStorage.getItem(storageKey);
        return storedValue ? JSON.parse(storedValue) : false;
      } catch (e) {
        console.error("Error reading from localStorage:", e);
        return false;
      }
    });
    
    // Zustand im localStorage speichern, wenn er sich ändert
    useEffect(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(stepsExpanded));
      } catch (e) {
        console.error("Error writing to localStorage:", e);
      }
    }, [stepsExpanded, storageKey]);

    const formatDate = (dateString: string) => {
      return format(new Date(dateString), "dd.MM.yyyy HH:mm", { locale: de });
    };

    const getStatusColor = (status: AnalysisStatus) => {
      switch (status) {
        case AnalysisStatus.COMPLETED:
          return "bg-green-500";
        case AnalysisStatus.FAILED:
          return "bg-red-500";
        case AnalysisStatus.PROCESSING:
          return "bg-blue-500";
        case AnalysisStatus.PENDING:
        default:
          return "bg-yellow-500";
      }
    };

    const getStatusLabel = (status: AnalysisStatus) => {
      switch (status) {
        case AnalysisStatus.COMPLETED:
          return "Abgeschlossen";
        case AnalysisStatus.FAILED:
          return "Fehlgeschlagen";
        case AnalysisStatus.PROCESSING:
          return "Wird verarbeitet";
        case AnalysisStatus.PENDING:
        default:
          return "Ausstehend";
      }
    };

    const getStatusProgress = (status: AnalysisStatus) => {
      if (status === AnalysisStatus.PROCESSING && analytics.progress) {
        // Wenn wir detaillierte Fortschrittsinformationen haben, berechnen wir den Fortschritt basierend darauf
        const { currentStep, totalSteps } = analytics.progress;
        return Math.round((currentStep / (totalSteps - 1)) * 100);
      }
      
      // Fallback zu den festen Werten
      switch (status) {
        case AnalysisStatus.COMPLETED:
          return 100;
        case AnalysisStatus.FAILED:
          return 100;
        case AnalysisStatus.PROCESSING:
          return 70;
        case AnalysisStatus.PENDING:
        default:
          return 30;
      }
    };

    const getAnalysisTypeLabel = (type: AnalysisType) => {
      switch (type) {
        case AnalysisType.TREND:
          return "Trend-Analyse";
        case AnalysisType.ANOMALY:
          return "Anomalie-Erkennung";
        case AnalysisType.FORECAST:
          return "Vorhersage";
        default:
          return type;
      }
    };

    const getAnalysisTypeIcon = (type: AnalysisType) => {
      switch (type) {
        case AnalysisType.TREND:
          return <TrendingUp className="h-4 w-4 mr-1" />;
        case AnalysisType.ANOMALY:
          return <AlertTriangle className="h-4 w-4 mr-1" />;
        case AnalysisType.FORECAST:
          return <LineChart className="h-4 w-4 mr-1" />;
        default:
          return null;
      }
    };

    const getSensorTypeLabel = (type: string): string => {
      switch (type.toLowerCase()) {
        case 'temperature':
          return 'Temperatur';
        case 'humidity':
          return 'Luftfeuchtigkeit';
        case 'brightness':
          return 'Lichtstärke';
        case 'soilmoisture':
          return 'Bodenfeuchtigkeit';
        default:
          return type;
      }
    };

    const getSensorTypeIcon = (type: string) => {
      switch (type.toLowerCase()) {
        case 'temperature':
          return <Thermometer className="h-4 w-4 mr-2 text-agrinode-temperature" />;
        case 'humidity':
          return <Droplet className="h-4 w-4 mr-2 text-agrinode-humidity" />;
        case 'soilmoisture':
          return <Flower className="h-4 w-4 mr-2 text-agrinode-soil" />;
        case 'brightness':
          return <Sun className="h-4 w-4 mr-2 text-agrinode-brightness" />;
        default:
          return null;
      }
    };

    const getStepStatusIcon = (step: ProgressStep) => {
      switch (step.status) {
        case 'completed':
          return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        case 'failed':
          return <XCircle className="h-4 w-4 text-red-500" />;
        case 'active':
          return <LoaderCircle className="h-4 w-4 text-blue-500 animate-spin" />;
        default:
          return <div className="h-4 w-4 rounded-full border border-gray-300"></div>;
      }
    };
    
    const getStepStatusClass = (step: ProgressStep) => {
      switch (step.status) {
        case 'completed':
          return "text-green-700 bg-green-50 border-green-200";
        case 'failed':
          return "text-red-700 bg-red-50 border-red-200";
        case 'active':
          return "text-blue-700 bg-blue-50 border-blue-200 font-medium";
        default:
          return "text-gray-500 bg-gray-50 border-gray-200";
      }
    };

    const getUsedModel = () => {
      // Bei abgeschlossenen Analysen: Zeige das tatsächlich verwendete Modell aus den Metadaten
      if (analytics.status === AnalysisStatus.COMPLETED && analytics.result?.metadata?.modelUsed) {
        return analytics.result.metadata.modelUsed;
      }
      
      // Bei laufenden oder ausstehenden Analysen: Zeige das ausgewählte Modell aus den Parametern
      if (analytics.parameters?.model) {
        return analytics.parameters.model;
      }
      
      // Fallback, wenn kein Modell angegeben ist
      return "Standard-Modell";
    };

    const renderTimeRange = () => {
      if (!analytics.parameters?.timeRange) return null;
      
      const { start, end } = analytics.parameters.timeRange;
      
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarRange className="h-3.5 w-3.5" />
          <span>{formatDate(start)} – {formatDate(end)}</span>
        </div>
      );
    };

    const renderMetadataInfo = () => {
      const isCompleted = analytics.status === AnalysisStatus.COMPLETED;
      const metadata = analytics.result?.metadata;
      
      return (
        <div className="flex flex-row justify-between sm:grid-cols-4 gap-2 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <BarChart4 className="h-3.5 w-3.5" />
            <span>Datenpunkte: {(isCompleted && metadata) ? (metadata.dataPointsAnalyzed || "—") : "—"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Erstellt: {formatDate(analytics.created_at)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Analysiert: {(isCompleted && metadata && metadata.analysisTimestamp) ? 
              formatDate(metadata.analysisTimestamp) : "—"}</span>
          </div>
          <div className="flex items-center justify-end sm:justify-start">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(analytics.analytics_id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Analyse löschen</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      );
    };

    const renderProgressSteps = () => {
      if (!analytics.progress || analytics.status !== AnalysisStatus.PROCESSING) {
        return null;
      }
      
      return (
        <div className="mt-4">
          <Collapsible
            open={stepsExpanded}
            onOpenChange={setStepsExpanded}
            className="w-full"
          >
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-medium">Fortschritt</h5>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-7 w-7">
                  {stepsExpanded ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent className="space-y-2">
              {analytics.progress.steps.map((step) => (
                <div 
                  key={step.index} 
                  className={`flex items-center space-x-2 p-2 border rounded-md ${getStepStatusClass(step)}`}
                >
                  {getStepStatusIcon(step)}
                  <span className="text-sm">{step.description}</span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
          
          {/* Fortschrittsanzeige innerhalb der Fortschrittskarte */}
          <div className="mt-2">
            <Progress 
              value={getStatusProgress(AnalysisStatus.PROCESSING)} 
              className="h-2" 
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                Schritt {analytics.progress.currentStep + 1} von {analytics.progress.totalSteps}
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.round((analytics.progress.currentStep / (analytics.progress.totalSteps - 1)) * 100)}%
              </span>
            </div>
          </div>
        </div>
      );
    };

    const renderStatusIndicator = () => {
      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Badge 
              variant="secondary" 
              className={`${getStatusColor(analytics.status)} text-white`}
            >
              {getStatusLabel(analytics.status)}
            </Badge>
            {(analytics.status === AnalysisStatus.PROCESSING || analytics.status === AnalysisStatus.PENDING) && (
              <span className="text-xs text-muted-foreground">
                {analytics.status === AnalysisStatus.PROCESSING ? "Wird bearbeitet..." : "In Warteschlange"}
              </span>
            )}
          </div>
        </div>
      );
    };

    const renderProcessingState = () => {
      if (analytics.status === AnalysisStatus.FAILED) {
        return (
          <div className="flex items-center gap-2 text-red-500 mt-4 p-3 border border-red-200 rounded-md bg-red-50">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Die Analyse konnte nicht abgeschlossen werden.</p>
              <p className="text-sm">Bitte versuchen Sie es später erneut oder wenden Sie sich an den Support.</p>
            </div>
          </div>
        );
      }
      
      if (analytics.status === AnalysisStatus.PENDING) {
        return (
          <div className="flex items-center gap-3 text-muted-foreground mt-4 p-3 border border-amber-200 rounded-md bg-amber-50">
            <Clock className="h-5 w-5 flex-shrink-0 text-amber-500" />
            <div>
              <p className="font-medium text-amber-700">Analyse in Warteschlange</p>
              <p className="text-sm">Die Analyse wurde eingeplant und wird bald gestartet.</p>
            </div>
          </div>
        );
      }
      
      if (analytics.status === AnalysisStatus.PROCESSING) {
        return (
          <>
            <div className="flex items-center gap-3 text-muted-foreground mt-4 p-3 border border-blue-200 rounded-md bg-blue-50">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-blue-700">Analyse wird durchgeführt</p>
                <p className="text-sm">Die KI analysiert Ihre Daten. Dies kann je nach Datenmenge einige Minuten dauern.</p>
              </div>
            </div>
            {renderProgressSteps()}
          </>
        );
      }
      
      return null;
    };

    const renderResult = () => {
      if (analytics.status !== AnalysisStatus.COMPLETED || !analytics.result) {
        return null;
      }

      return (
        <div className="mt-4 space-y-5">
          {analytics.result.overallSummary && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-md border border-blue-100">
              <h3 className="text-sm font-medium flex items-center mb-2">
                <FileText className="h-4 w-4 mr-2 text-blue-600" />
                Zusammenfassung
              </h3>
              <p className="text-sm leading-relaxed">{analytics.result.overallSummary}</p>
            </div>
          )}
          
          {analytics.result.recommendations && analytics.result.recommendations.length > 0 && (
            <Collapsible 
              open={isRecommendationsOpen}
              onOpenChange={setIsRecommendationsOpen}
              className="border rounded-md mt-5"
            >
              <CollapsibleTrigger asChild>
                <div className="flex justify-between items-center p-3 cursor-pointer hover:bg-secondary/50">
                  <div className="flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
                    <h4 className="font-medium">Empfehlungen</h4>
                  </div>
                  <span>
                    {isRecommendationsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-3 pt-0 space-y-2 bg-amber-50">
                <ul className="text-sm list-disc pl-5 pt-3 space-y-2">
                  {Array.isArray(analytics.result.recommendations) ? 
                    analytics.result.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-amber-900">{rec}</li>
                    )) : 
                    <li className="text-amber-900">{analytics.result.recommendations}</li>
                  }
                </ul>
              </CollapsibleContent>
            </Collapsible>
          )}
          
          {analytics.result.sensorAnalyses && analytics.result.sensorAnalyses.length > 0 && (
            <Collapsible 
              open={isDetailedAnalysisOpen} 
              onOpenChange={setIsDetailedAnalysisOpen}
              className="border rounded-md mt-2"
            >
              <CollapsibleTrigger asChild>
                <div className="flex justify-between items-center p-3 cursor-pointer hover:bg-secondary/50">
                  <div className="flex items-center">
                    <List className="h-4 w-4 mr-2" />
                    <h4 className="font-medium">Detaillierte Analyse</h4>
                  </div>
                  <span>
                    {isDetailedAnalysisOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-3 pt-0 space-y-2 border-t">
                {analytics.result.sensorAnalyses.map((analysis: any, index: number) => (
                  <div key={index} className="bg-secondary p-3 rounded-md mt-2">
                    <h5 className="font-medium text-sm flex items-center">
                      {getSensorTypeIcon(analysis.sensorType)}
                      {getSensorTypeLabel(analysis.sensorType)}
                    </h5>
                    <p className="text-sm">{analysis.summary}</p>
                    
                    {analysis.trends && analysis.trends.length > 0 && (
                      <div className="mt-2">
                        <h6 className="text-xs font-medium flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Erkannte Trends:
                        </h6>
                        <ul className="text-xs list-disc pl-4">
                          {analysis.trends.map((trend: any, tIndex: number) => (
                            <li key={tIndex}>{trend.description} (Konfidenz: {(trend.confidence * 100).toFixed(0)}%)</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {analysis.anomalies && analysis.anomalies.length > 0 && (
                      <div className="mt-2">
                        <h6 className="text-xs font-medium flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Erkannte Anomalien:
                        </h6>
                        <ul className="text-xs list-disc pl-4">
                          {analysis.anomalies.map((anomaly: any, aIndex: number) => (
                            <li key={aIndex}>{anomaly.description} (Schwere: {anomaly.severity})</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      );
    };

    // Hauptlayout der Komponente
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
        <Card className={cn(
          "overflow-hidden transition-shadow duration-200",
          isOpen ? "shadow-md" : "hover:shadow-sm",
          analytics.status === AnalysisStatus.PROCESSING && "border-blue-300 bg-blue-50/30",
          analytics.status === AnalysisStatus.PENDING && "border-amber-300 bg-amber-50/30"
        )}>
          <CardHeader className={cn(
            "pb-3",
            (analytics.status === AnalysisStatus.PROCESSING || analytics.status === AnalysisStatus.PENDING) && "pb-2"
          )}>
            {/* Kopfzeile mit Analyse-Typ, Sensorname und Status */}
            <div className="flex flex-col">
              <div className="flex items-start justify-between">
                <CollapsibleTrigger asChild>
                  <div className="flex-1 flex justify-between items-center cursor-pointer group">
                    <div className="flex-1 flex items-center">
                      <CardTitle className="text-lg flex items-center">
                        {getAnalysisTypeIcon(analytics.type)}
                        {getAnalysisTypeLabel(analytics.type)}
                      </CardTitle>
                      <span className="ml-2 text-muted-foreground group-hover:text-foreground transition-colors">
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(analytics.status)} text-white ml-3`}
                    >
                      {getStatusLabel(analytics.status)}
                    </Badge>
                  </div>
                </CollapsibleTrigger>
              </div>
              
              <CardDescription className="mt-1">
                <div className="flex items-center gap-2">
                  <span>{sensorName}</span>
                  {renderTimeRange()}
                </div>
              </CardDescription>
            </div>
            
            {/* Info-Bar mit Modell in einer horizontal angeordneten leiste */}
            <div className="mt-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs inline-flex items-center bg-secondary text-muted-foreground px-2 py-1 rounded-md">
                      <Cpu className="h-3 w-3 mr-1" />
                      <span>
                        {getUsedModel().length > 20 ? `${getUsedModel().substring(0, 17)}...` : getUsedModel()}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Verwendetes Modell: {getUsedModel()}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {renderMetadataInfo()}
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0">
              {renderProcessingState()}
              {renderResult()}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  },
  (prevProps, nextProps) => {
    // Prüfe, ob die Props tatsächlich geändert wurden, bevor neu gerendert wird
    return (
      prevProps.analytics.analytics_id === nextProps.analytics.analytics_id &&
      prevProps.analytics.status === nextProps.analytics.status &&
      prevProps.sensorName === nextProps.sensorName &&
      prevProps.isExpanded === nextProps.isExpanded &&
      // Prüfe auf Änderungen im Fortschritt
      JSON.stringify(prevProps.analytics.progress) === JSON.stringify(nextProps.analytics.progress) &&
      // Bei komplexen Objekten (result) nur relevant, wenn Status "completed" ist
      (prevProps.analytics.status !== AnalysisStatus.COMPLETED ||
        JSON.stringify(prevProps.analytics.result) === JSON.stringify(nextProps.analytics.result))
    );
  }
);