import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Peticion } from '../../servicios/peticion';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { CommonModule } from '@angular/common';

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
);

@Component({
  selector: 'app-servicios-graficos',
  standalone: true,
  imports: [Header, Footer, CommonModule],
  templateUrl: './servicios-graficos.html',
  styleUrls: ['./servicios-graficos.css']
})
export class ServiciosGraficos implements OnInit, AfterViewChecked {

  userId!: number;
  historial: any[] = [];
  chartPeso: Chart | null = null;
  graficoCreado = false;

  constructor(
    private route: ActivatedRoute,
    private peticion: Peticion
  ) {}

  ngOnInit(): void {
    this.userId = Number(this.route.snapshot.paramMap.get('userId'));
    this.cargarHistorial();
  }

  ngAfterViewChecked(): void {
    if (
      this.historial.length > 0 &&
      !this.graficoCreado &&
      document.getElementById('pesoChart')
    ) {
      this.crearGraficoPeso();
      this.graficoCreado = true;
    }
  }

  cargando = true;

  cargarHistorial(): void {
  this.cargando = true;

  const token = localStorage.getItem('token') || undefined;

  this.peticion.get(
    `${this.peticion.urlReal}/api/usersFitness/${this.userId}/last`,
    token
  )
  .then((res: any) => {
    console.log('📊 Historial recibido:', res);

    this.historial = Array.isArray(res) ? res : [];
    this.cargando = false;
  })
  .catch(err => {
    console.error('Error cargando historial', err);
    this.cargando = false;
  });
}


  crearGraficoPeso(): void {
    if (!this.historial.length) return;

    const labels = this.historial.map(h => h.recordDate);
    const data = this.historial.map(h => h.weight);

    const canvas = document.getElementById('pesoChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.chartPeso) {
      this.chartPeso.destroy();
    }

    this.chartPeso = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Peso (kg)',
            data,
            fill: false,
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          title: {
            display: true,
            text: 'Evolución del peso'
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Kg'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Fecha'
            }
          }
        }
      }
    });
  }
}
