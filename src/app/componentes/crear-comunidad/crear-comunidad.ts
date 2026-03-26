import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { Peticion } from '../../servicios/peticion';

@Component({
  selector: 'app-crear-comunidad',
  imports: [Header, Footer, CommonModule, FormsModule, RouterModule],
  templateUrl: './crear-comunidad.html',
  styleUrls: ['./crear-comunidad.css'],
})
export class CrearComunidad implements OnInit {

  form = {
    name: '',
    description: '',
    category: '',
  };

  loading: boolean = false;
  submitted: boolean = false;
  serverError: string = '';
  serverSuccess: string = '';

  private creatorId: number | null = null;

  constructor(
    private peticion: Peticion,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Obtener el ID del creador desde el localStorage
    const userStorage = localStorage.getItem('user');
    if (userStorage) {
      try {
        const user = JSON.parse(userStorage);
        this.creatorId = user?.userId ?? user?.id ?? null;
      } catch {
        this.creatorId = null;
      }
    }
  }

  limpiarFeedback(): void {
    this.serverError = '';
    this.serverSuccess = '';
  }

  traducirCategoria(categoria: string): string {
    switch (categoria) {
      case 'FITNESS':             return 'Fitness';
      case 'NUTRITION':           return 'Nutrición';
      case 'PERSONAL_DEVELOPMENT':return 'Desarrollo personal';
      default:                    return categoria || '';
    }
  }

  crear(form: NgForm): void {
    this.submitted = true;
    this.limpiarFeedback();

    if (form.invalid) {
      this.serverError = 'Completa todos los campos antes de continuar.';
      return;
    }

    if (!this.creatorId) {
      this.serverError = 'No se pudo identificar tu usuario. Vuelve a iniciar sesión.';
      return;
    }

    this.loading = true;

    const payload = {
      name:        this.form.name.trim(),
      description: this.form.description.trim(),
      category:    this.form.category,
      creatorId:   this.creatorId,
    };

    const url = `${this.peticion.urlReal}/api/communities/create`;
    const token = localStorage.getItem('token') || undefined;

    this.peticion
      .post(url, payload, token)
      .then((res: any) => {
        this.serverSuccess = '¡Comunidad creada correctamente!';
        const id = res?.id ?? res?.data?.id;
        setTimeout(() => {
          if (id) {
            this.router.navigate(['/comunidad', id]);
          } else {
            this.router.navigate(['/comunidades']);
          }
        }, 800);
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        this.serverError =
          err?.error?.message ||
          'No fue posible crear la comunidad. Intenta de nuevo.';
                  this.cdr.detectChanges(); 
      })
      .finally(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });
  }
}