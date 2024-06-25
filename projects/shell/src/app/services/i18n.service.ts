import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class I18nService {

  private translations: { [key: string]: string } = {};

  constructor(private http: HttpClient) { }

  async loadTranslations(locale: string) {
    const mainTranslations = await this.loadJson(`/assets/i18n/${locale}.json`);
    const featureTranslations = await this.loadFeatureTranslations(locale);

    this.translations = { ...mainTranslations, ...featureTranslations };
  }

  private async loadJson(path: string): Promise<{ [key: string]: string }> {
    try {
      return await firstValueFrom(this.http.get<{ [key: string]: string }>(path));
    } catch {
      return {};
    }
  }

  private async loadFeatureTranslations(locale: string): Promise<{ [key: string]: string }> {
    const paths = [
      `/assets/i18n/feature1/${locale}.json`,
      `/assets/i18n/feature2/${locale}.json`
    ];

    const translations = await Promise.all(paths.map(path => this.loadJson(path)));
    return Object.assign({}, ...translations);
  }

  translate(key: string): any {
    let obj = this.translations;
    if (key in obj) {
      return obj[key];
    }
    const keys = key.split(".");
    let value: any = obj;
    for (let i = 0; i < keys.length; i++) {
      value = value[keys[i]];
      if (value === undefined) {
        return key;
      }
    }

    return value;
  }
}
