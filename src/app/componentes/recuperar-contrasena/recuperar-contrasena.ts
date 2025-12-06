import { Component } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,                     // ⬅⬅⬅ NECESARIO
  imports: [CommonModule, FormsModule], // ⬅⬅⬅ AQUÍ SE SOLUCIONA ngModel
  templateUrl: './recuperar-contrasena.html',
  styleUrls: ['./recuperar-contrasena.css']
})
export class RecuperarContrasenaComponent {

  model = {
    codigo: '',
    nueva: '',
    confirmar: ''
  };

  mensaje: string | null = null;
  mensajeTipo: 'success' | 'danger' | 'info' = 'info';

  showMessage(text: string, type: any = 'danger') {
    this.mensaje = text;
    this.mensajeTipo = type;
  }

  onSubmit(form: NgForm) {

    if (form.invalid || this.model.nueva !== this.model.confirmar) {
      this.showMessage('Corrige los errores en el formulario.', 'danger');
      return;
    }

    this.showMessage('Enviando solicitud...', 'info');

    setTimeout(() => {
      this.showMessage('Tu contraseña se ha restablecido correctamente.', 'success');
      form.reset();
    }, 900);
  }
}
