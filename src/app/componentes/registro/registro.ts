import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrls: ['./registro.css']
})
export class Registro {

  // Paso actual
  step: number = 1;

  // FORMULARIO PASO 1
  formStep1 = {
    email: '',
    username: '',
    password: '',
    password2: ''
  };

  // FORMULARIO PASO 2
  formStep2 = {
    nombre: '',
    segundoNombre: '',
    apellido: '',
    segundoApellido: '',
    peso: null as number | null,
    altura: null as number | null,
    genero: ''
  };

  constructor() { }

  // Cambiar al paso 2
  nextStep() {
    this.step = 2;
  }

  // Volver al paso 1
  prevStep() {
    this.step = 1;
  }

  // Método de registro (HTML llama register())
  register() {
    console.log('Datos enviados:');
    console.log(this.formStep1);
    console.log(this.formStep2);
  }
}

