import React, { useState } from "react";
import { SensorAnalytics, AnalysisStatus, AnalysisType } from "@/types/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, AlertCircle, TrendingUp, AlertTriangle, LineChart, ChevronDown, ChevronUp, FileText, Lightbulb, List, Thermometer, Droplet, Flower, Sun } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

    const renderTimeRange = () => {
      if (!analytics.parameters?.timeRange) return null;
      
      const { start, end } = analytics.parameters.timeRange;
      return (
        <div className="text-sm text-muted-foreground flex justify-between items-center">
          <p>Zeitraum: {formatDate(start)} bis {formatDate(end)}</p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(analytics.analytics_id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    };

    const renderResult = () => {
      if (analytics.status !== AnalysisStatus.COMPLETED || !analytics.result) {
        return null;
      }

      return (
        <div className="mt-4 space-y-4">
          {analytics.result.overallSummary && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Zusammenfassung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{analytics.result.overallSummary}</p>
              </CardContent>
            </Card>
          )}
          
          {analytics.result.sensorAnalyses && analytics.result.sensorAnalyses.length > 0 && (
            <Collapsible 
              open={isDetailedAnalysisOpen} 
              onOpenChange={setIsDetailedAnalysisOpen}
              className="border rounded-md"
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
              <CollapsibleContent className="p-3 pt-0 space-y-2">
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
                            <li key={tIndex}>{trend.description}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {analysis.anomalies && analysis.anomalies.length > 0 && (
                      <div className="mt-2">
                        <h6 className="text-xs font-medium flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Anomalien:
                        </h6>
                        <ul className="text-xs list-disc pl-4">
                          {analysis.anomalies.map((anomaly: any, aIndex: number) => (
                            <li key={aIndex}>{anomaly.description}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
          
          {analytics.result.recommendations && (
            <div>
              <h4 className="font-medium mb-1 flex items-center">
                <Lightbulb className="h-4 w-4 mr-2" />
                Empfehlungen
              </h4>
              <ul className="text-sm list-disc pl-5">
                {Array.isArray(analytics.result.recommendations) ? 
                  analytics.result.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  )) : 
                  <li>{analytics.result.recommendations}</li>
                }
              </ul>
            </div>
          )}
        </div>
      );
    };

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <div>
                <CollapsibleTrigger asChild>
                  <CardTitle className="text-lg flex items-center cursor-pointer group">
                    {getAnalysisTypeIcon(analytics.type)}
                    {getAnalysisTypeLabel(analytics.type)}
                    <span className="ml-2 text-muted-foreground group-hover:text-foreground transition-colors">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                  </CardTitle>
                </CollapsibleTrigger>
                <CardDescription>
                  {sensorName}
                </CardDescription>
              </div>
              <Badge variant="secondary" className={`${getStatusColor(analytics.status)} text-white`}>
                {getStatusLabel(analytics.status)}
              </Badge>
            </div>
            
            <div className="mt-2">
              <div className="text-xs text-muted-foreground">
                Erstellt: {formatDate(analytics.created_at)}
              </div>
            </div>
            
            {renderTimeRange()}
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0">
              {analytics.status === AnalysisStatus.FAILED && (
                <div className="flex items-center gap-2 text-red-500 mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">Die Analyse konnte nicht abgeschlossen werden.</p>
                </div>
              )}
              
              {analytics.status === AnalysisStatus.PENDING && (
                <div className="text-sm text-muted-foreground mt-2">
                  <p>Die Analyse steht in der Warteschlange und wird bald gestartet.</p>
                </div>
              )}
              
              {analytics.status === AnalysisStatus.PROCESSING && (
                <div className="text-sm text-muted-foreground mt-2">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <p>Die Analyse wird gerade durchgeführt...</p>
                  </div>
                </div>
              )}
              
              {renderResult()}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  },
  // Prüfe, ob die Props tatsächlich geändert wurden, bevor neu gerendert wird
  (prevProps, nextProps) => {
    // Nur neu rendern, wenn sich die relevanten Props geändert haben
    return (
      prevProps.analytics.analytics_id === nextProps.analytics.analytics_id &&
      prevProps.analytics.status === nextProps.analytics.status &&
      prevProps.sensorName === nextProps.sensorName &&
      prevProps.isExpanded === nextProps.isExpanded &&
      // Bei komplexen Objekten (result) nur relevant, wenn Status "completed" ist
      (prevProps.analytics.status !== AnalysisStatus.COMPLETED ||
        JSON.stringify(prevProps.analytics.result) === JSON.stringify(nextProps.analytics.result))
    );
  }
);