import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { Peticion } from '../../servicios/peticion';

Chart.register(...registerables);

interface FitnessRecord {
  id?: number;
  recordDate?: string;
  userId: number;
  weight: number;
  bodyFatPercentage: number;
  chestMeasurement: number;
  waistMeasurement: number;
  hipMeasurement: number;
  armMeasurement: number;
  thighMeasurement: number;
}

@Component({
  selector: 'app-fitness-history',
  standalone: true,
  imports: [CommonModule, Header, Footer, FormsModule, RouterLink],
  templateUrl: './servicio.component.html',
  styleUrl: './servicio.component.css'
})
export class ServicioComponent implements OnInit, AfterViewChecked {
  @ViewChild('weightChartCanvas') weightChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('bodyFatChartCanvas') bodyFatChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('measurementsChartCanvas') measurementsChartCanvas?: ElementRef<HTMLCanvasElement>;

  usuario: any = {};
  fitnessHistory: FitnessRecord[] = [];

  loadingHistory = false;
  loadingUser = false;
  creatingRecord = false;

  errorMessage = '';
  successMessage = '';
  formError = '';
  formSuccess = '';

  activeTab: 'history' | 'create' | 'charts' = 'history';

  private expandedIds = new Set<number>();
  private chartsNeedRender = false;

  weightChart: Chart | null = null;
  bodyFatChart: Chart | null = null;
  measurementsChart: Chart | null = null;

  fitnessForm: FitnessRecord = {
    userId: 0,
    weight: 0,
    bodyFatPercentage: 0,
    chestMeasurement: 0,
    waistMeasurement: 0,
    hipMeasurement: 0,
    armMeasurement: 0,
    thighMeasurement: 0
  };

  constructor(
    private peticion: Peticion,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  ngAfterViewChecked(): void {
    if (this.chartsNeedRender && this.activeTab === 'charts') {
      const canvasesReady =
        !!this.weightChartCanvas?.nativeElement &&
        !!this.bodyFatChartCanvas?.nativeElement &&
        !!this.measurementsChartCanvas?.nativeElement;

      if (canvasesReady) {
        this.renderCharts();
        this.chartsNeedRender = false;
      }
    }
  }

  setActiveTab(tab: 'history' | 'create' | 'charts'): void {
    this.activeTab = tab;
    this.formError = '';
    this.formSuccess = '';

    if (tab === 'charts') {
      this.chartsNeedRender = true;
      this.cdr.detectChanges();
    }
  }

  toggleExpanded(id: number): void {
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
      return;
    }
    this.expandedIds.add(id);
  }

  isExpanded(id: number): boolean {
    return this.expandedIds.has(id);
  }

  loadCurrentUser(): void {
    this.loadingUser = true;

    const userStorage = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userStorage || !token) {
      this.formError = 'No se pudo identificar el usuario actual.';
      this.loadingUser = false;
      return;
    }

    try {
      const parsedUser = JSON.parse(userStorage);
      const userId = parsedUser?.userId || parsedUser?.id;

      if (!userId) {
        this.formError = 'El usuario actual no tiene un identificador válido.';
        this.loadingUser = false;
        return;
      }

      const url = `${this.peticion.urlReal}/api/users/get/${userId}`;

      this.peticion.get(url, token)
        .then((res: any) => {
          this.usuario = res?.data || res;
          this.fitnessForm.userId = this.usuario?.userId || this.usuario?.id || 0;
          this.loadFitnessHistory();
        })
        .catch((err: any) => {
          console.error('Error cargando usuario', err);
          this.formError = 'No fue posible cargar el usuario.';
        })
        .finally(() => {
          this.loadingUser = false;
          this.cdr.detectChanges();
        });
    } catch (error) {
      console.error('Error leyendo user del localStorage', error);
      this.formError = 'No se pudo leer la sesión actual.';
      this.loadingUser = false;
      this.cdr.detectChanges();
    }
  }

  loadFitnessHistory(): void {
    this.loadingHistory = true;
    this.errorMessage = '';

    const token = localStorage.getItem('token') || undefined;
    const userId = this.usuario?.userId || this.usuario?.id;

    if (!userId) {
      this.errorMessage = 'No se encontró el id del usuario.';
      this.loadingHistory = false;
      return;
    }

    // Ajusta este endpoint si tu backend usa otro
    const url = `${this.peticion.urlReal}/api/usersFitness/history/${userId}/latest`;

    this.peticion.get(url, token)
      .then((res: any) => {
        const data = res?.data || res || [];

        if (Array.isArray(data)) {
          this.fitnessHistory = this.sortHistoryByDate(data);
        } else if (data && typeof data === 'object') {
          this.fitnessHistory = this.sortHistoryByDate([data]);
        } else {
          this.fitnessHistory = [];
        }

        if (this.activeTab === 'charts') {
          this.chartsNeedRender = true;
        }

        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        console.error('Error al cargar histórico fitness', err);
        this.errorMessage = 'No fue posible cargar el histórico fitness.';
        this.fitnessHistory = [];
        this.destroyCharts();
      })
      .finally(() => {
        this.loadingHistory = false;
        this.cdr.detectChanges();
      });
  }

  createFitnessRecord(): void {
    if (!this.validateFitnessForm()) {
      return;
    }

    this.creatingRecord = true;
    this.formError = '';
    this.formSuccess = '';
    this.successMessage = '';
    this.errorMessage = '';

    const token = localStorage.getItem('token') || undefined;

    const payload = {
      userId: Number(this.fitnessForm.userId),
      weight: Number(this.fitnessForm.weight),
      bodyFatPercentage: Number(this.fitnessForm.bodyFatPercentage),
      chestMeasurement: Number(this.fitnessForm.chestMeasurement),
      waistMeasurement: Number(this.fitnessForm.waistMeasurement),
      hipMeasurement: Number(this.fitnessForm.hipMeasurement),
      armMeasurement: Number(this.fitnessForm.armMeasurement),
      thighMeasurement: Number(this.fitnessForm.thighMeasurement)
    };

    const url = `${this.peticion.urlReal}/api/usersFitness/fitness`;

    this.peticion.post(url, payload, token)
      .then((res: any) => {
        this.formSuccess = res?.message || res?.mensaje || 'Registro fitness guardado correctamente.';
        this.successMessage = 'Tu histórico fue actualizado.';
        this.resetForm();
        this.activeTab = 'history';
        this.loadFitnessHistory();
      })
      .catch((err: any) => {
        console.error('Error creando registro fitness', err);
        this.formError =
          err?.error?.mensaje ||
          err?.error?.message ||
          'No fue posible guardar el registro fitness.';
      })
      .finally(() => {
        this.creatingRecord = false;
        this.cdr.detectChanges();
      });
  }

  validateFitnessForm(): boolean {
    const values = [
      this.fitnessForm.weight,
      this.fitnessForm.bodyFatPercentage,
      this.fitnessForm.chestMeasurement,
      this.fitnessForm.waistMeasurement,
      this.fitnessForm.hipMeasurement,
      this.fitnessForm.armMeasurement,
      this.fitnessForm.thighMeasurement
    ];

    if (!this.fitnessForm.userId) {
      this.formError = 'No se pudo identificar el usuario.';
      return false;
    }

    const hasInvalid = values.some(v => v === null || v === undefined || Number(v) <= 0);

    if (hasInvalid) {
      this.formError = 'Todos los campos deben ser mayores a 0.';
      return false;
    }

    return true;
  }

  resetForm(): void {
    this.fitnessForm = {
      userId: this.usuario?.userId || this.usuario?.id || 0,
      weight: 0,
      bodyFatPercentage: 0,
      chestMeasurement: 0,
      waistMeasurement: 0,
      hipMeasurement: 0,
      armMeasurement: 0,
      thighMeasurement: 0
    };
  }

  sortHistoryByDate(records: FitnessRecord[]): FitnessRecord[] {
    return [...records].sort((a, b) => {
      const dateA = new Date(a.recordDate || '').getTime();
      const dateB = new Date(b.recordDate || '').getTime();
      return dateA - dateB;
    });
  }

  renderCharts(): void {
    if (!this.fitnessHistory.length) {
      this.destroyCharts();
      return;
    }

    if (
      !this.weightChartCanvas?.nativeElement ||
      !this.bodyFatChartCanvas?.nativeElement ||
      !this.measurementsChartCanvas?.nativeElement
    ) {
      return;
    }

    this.destroyCharts();

    const labels = this.fitnessHistory.map(record =>
      record.recordDate
        ? new Date(record.recordDate).toLocaleDateString()
        : 'Sin fecha'
    );

    this.weightChart = new Chart(this.weightChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Peso (kg)',
            data: this.fitnessHistory.map(r => r.weight),
            borderColor: '#FF5A00',
            backgroundColor: 'rgba(255, 90, 0, 0.15)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: this.getChartOptions()
    });

    this.bodyFatChart = new Chart(this.bodyFatChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Grasa corporal (%)',
            data: this.fitnessHistory.map(r => r.bodyFatPercentage),
            borderColor: '#19c864',
            backgroundColor: 'rgba(25, 200, 100, 0.12)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: this.getChartOptions()
    });

    this.measurementsChart = new Chart(this.measurementsChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Pecho',
            data: this.fitnessHistory.map(r => r.chestMeasurement),
            borderColor: '#FF5A00',
            tension: 0.3
          },
          {
            label: 'Cintura',
            data: this.fitnessHistory.map(r => r.waistMeasurement),
            borderColor: '#50a0ff',
            tension: 0.3
          },
          {
            label: 'Cadera',
            data: this.fitnessHistory.map(r => r.hipMeasurement),
            borderColor: '#19c864',
            tension: 0.3
          },
          {
            label: 'Brazo',
            data: this.fitnessHistory.map(r => r.armMeasurement),
            borderColor: '#f7b801',
            tension: 0.3
          },
          {
            label: 'Muslo',
            data: this.fitnessHistory.map(r => r.thighMeasurement),
            borderColor: '#d96cfa',
            tension: 0.3
          }
        ]
      },
      options: this.getChartOptions()
    });
  }

  getChartOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#ffffff'
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#aaaaaa' },
          grid: { color: '#222222' }
        },
        y: {
          ticks: { color: '#aaaaaa' },
          grid: { color: '#222222' }
        }
      }
    };
  }

  destroyCharts(): void {
    if (this.weightChart) {
      this.weightChart.destroy();
      this.weightChart = null;
    }

    if (this.bodyFatChart) {
      this.bodyFatChart.destroy();
      this.bodyFatChart = null;
    }

    if (this.measurementsChart) {
      this.measurementsChart.destroy();
      this.measurementsChart = null;
    }
  }

  trackByRecordId(index: number, item: FitnessRecord): number {
    return item.id || index;
  }
}