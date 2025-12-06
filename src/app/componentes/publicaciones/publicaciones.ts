declare var bootstrap: any;

import { Component, ElementRef, ViewChild } from '@angular/core';
import { Header } from "../header/header";
import { Footer } from "../footer/footer";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-publicaciones',
  templateUrl: './publicaciones.html',
  styleUrls: ['./publicaciones.css'],
  standalone: true,
  imports: [Header, Footer, FormsModule, CommonModule]
})
export class PublicacionesComponent {

  @ViewChild('modalPublicacion') modalPublicacion!: ElementRef;
  modalInstance: any;

  newPostContent: string = "";
  selectedImageFile: File | null = null;
  imagePreview: string | null = null;

  posts: any[] = [
    {
      username: 'Ana',
      avatar: 'https://i.pravatar.cc/150?img=32',
      content: 'Buen entreno hoy! 5km corridos 🏃‍♀️',
      date: 'Hace 2 horas',
      likes: 12,
      image: 'https://images.unsplash.com/photo-1526403224740-4b1b6da6f8bb?auto=format&fit=crop&w=1200&q=60',
      menuOpen: false
    },
    {
      username: 'Carlos',
      avatar: 'https://i.pravatar.cc/150?img=5',
      content: '¿Alguien tiene rutina para core?',
      date: 'Ayer',
      likes: 8,
      menuOpen: false
    }
  ];

  constructor() {
    // Cerrar menús al hacer clic fuera
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".post-menu-wrapper")) {
        this.closeAllMenus();
      }
    });
  }

  //Menú de Opciones Funcionando

  toggleMenu(post: any) {
    this.posts.forEach(p => {
      if (p !== post) p.menuOpen = false;
    });
    post.menuOpen = !post.menuOpen;
  }

  closeAllMenus() {
    this.posts.forEach(p => p.menuOpen = false);
  }

  //Modal Funcionando

  openModal() {
    const modalEl = this.modalPublicacion.nativeElement;
    this.modalInstance = new bootstrap.Modal(modalEl);
    this.modalInstance.show();
  }

  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
    this.closeAllMenus();
  }

//Imágenes e Inputs sin Funcionalidad

  onImageSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedImageFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  //Publicaciones pronto a realizar

  publish() {
    alert("La creación de publicaciones estará disponible pronto.");
    this.closeModal();

    this.newPostContent = "";
    this.selectedImageFile = null;
    this.imagePreview = null;
  }
}
