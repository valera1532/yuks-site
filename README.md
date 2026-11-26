# Сайт ЮКС

## Размещение на REG.RU

Загрузите файлы сайта в каталог домена `sk-yuks.ru` на виртуальном хостинге с PHP 8. Файлы `index.html` и `contact.php` должны находиться рядом.

Форма отправляет обращения на `yuks61@mail.ru` через функцию PHP `mail()`. Для отправителя создайте ящик `site@sk-yuks.ru` и укажите его в параметре `sendmail_path` в настройках PHP на хостинге. Пример строки для REG.RU

```ini
sendmail_path = "/usr/sbin/sendmail -t -i -f site@sk-yuks.ru"
```

После публикации отправьте тестовую заявку с сайта и проверьте её получение в ящике ЮКС. [Инструкция REG.RU по доставке писем на Mail.ru](https://help.reg.ru/support/hosting/nastroyka-pochty-regru/problemyy/ne-otpravlyayetsya-pochta-na-mail-ruu)
