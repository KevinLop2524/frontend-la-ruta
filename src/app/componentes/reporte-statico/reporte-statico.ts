import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Header } from "../header/header";
import { Footer } from "../footer/footer";
import { Peticion } from '../../servicios/peticion';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reporte-statico',
  imports: [Header, Footer, CommonModule, FormsModule],
  templateUrl: './reporte-statico.html',
  styleUrl: './reporte-statico.css'
})
export class ReporteStatico implements OnInit{
  usuarios:any
  tokenLog : any
  constructor(private peticion: Peticion, private cdr: ChangeDetectorRef){}
  ngOnInit(): void {
      this.tokenLog = localStorage.getItem("token")
      this.cargarUsuarios()
  }
  cargarUsuarios(){
    let post = {
      host: this.peticion.urlReal,
      path: "/usuarios/info",
      payload: {
      }
    }
    this.peticion.get(post.host + post.path, ).then((res: any) => {
      console.log(res)
      this.usuarios = res
      this.cdr.detectChanges()
    }).catch((err) => {
      console.log(err)
      console.log("Error al obtener comunidades")
    })
  }

  reporte(){
    this.peticion.downloadPdf(this.peticion.urlReal + '/usuarios/pdf')
  .then((pdfBlob: Blob) => {
    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'usuarios.pdf';
    a.click();
    window.URL.revokeObjectURL(url);
  })
  .catch(err => console.error('Error descargando PDF', err));
  }

}

// const headers = new HttpHeaders({
//   'Authorization': `Bearer ${localStorage.getItem("token")}`
// });

// this.http.post("http://localhost:8080/comunidad/crear", payload, { headers })
//   .subscribe(res => console.log(res));
