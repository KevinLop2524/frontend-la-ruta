import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Peticion {

  constructor(private http: HttpClient) { }

  urlReal: string = "https://laruta.kolisevm.online/api"
  requestOptions: any = {}

  post = (url: string, payload: {}, token?: string) => {

    let promesa = new Promise((resolve, reject) => {
      this.requestOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }), withCredentials: true
      }
      this.http.post(url, payload, this.requestOptions).toPromise()
        .then((res: any) => {
          resolve(res)
        }).catch((error: any) => {
          reject(error)
        })
    })
    return promesa
  }

  get = (url: string, token?: string) => {

    let promesa = new Promise((resolve, reject) => {

      this.requestOptions = {
        headers: new HttpHeaders(
          token ? { Authorization: `Bearer ${token}` } : {}
        ), withCredentials: true
      }
      this.http.get(url, this.requestOptions).toPromise()
        .then((res: any) => {
          resolve(res)
        }).catch((error: any) => {
          reject(error)
        })
    })
    return promesa
  }

  put = (url: string, payload: {}, token?: string) => {

    let promesa = new Promise((resolve, reject) => {

      this.requestOptions = {
        headers: new HttpHeaders(
          token ? { Authorization: `Bearer ${token}` } : {}
        ), withCredentials: true
      }
      this.http.put(url, payload, this.requestOptions).toPromise()
        .then((res: any) => {
          resolve(res)
        }).catch((error: any) => {
          reject(error)
        })
    })
    return promesa
  }

  patch = (url: string, payload: {}, token?: string) => {

  let promesa = new Promise((resolve, reject) => {

    this.requestOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }),
      withCredentials: true
    }

    this.http.patch(url, payload, this.requestOptions).toPromise()
      .then((res: any) => {
        resolve(res)
      }).catch((error: any) => {
        reject(error)
      })
  })

  return promesa
}


  delete = (url: string, payload: {}) => {

    let promesa = new Promise((resolve, reject) => {

      this.requestOptions = {
        headers: new HttpHeaders({
          //"":""
        }), withCredentials: true,
        body: payload
      }
      this.http.request("delete", url, this.requestOptions).toPromise()
        .then((res: any) => {
          resolve(res)
        }).catch((error: any) => {
          reject(error)
        })
    })
    return promesa
  }

  UploadFile(file: File, api: string): Observable<any> {
    const formData = new FormData
    formData.append('file', file)
    return this.http.post(api, formData)
  }

  uploadBulk(formData: FormData, api: string) {
  return this.http.post(api, formData, {
    withCredentials: true
  }).toPromise();
}
postFormData = (url: string, formData: FormData, token?: string) => {

  let promesa = new Promise((resolve, reject) => {

    this.requestOptions = {
      headers: new HttpHeaders({
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }),
      withCredentials: true
    }

    this.http.post(url, formData, this.requestOptions).toPromise()
      .then((res: any) => resolve(res))
      .catch((error: any) => reject(error))
  })

  return promesa
}


  downloadPdfPost(url: string, body: any, token?: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {}),
      responseType: 'blob' as const,
      withCredentials: true
    };

    this.http.post(url, body, options)
      .toPromise()
      .then((res) => resolve(res as Blob))
      .catch((err) => reject(err));
  });
}
}