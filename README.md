<img src="/public/Logo_Quip-Exporter.png" width="128">

## The Quip Exporter

Quip is a great tool to create well formatted documents on desktop as well as on mobile devices. Unfortunately it lacks two important features:

1. To export all documents at once
2. To export to html or md including image files

This tool will perform a

- **full export** of your Quip account's
- **private & shared folders**.

The files will be exported as

- **HTML, md & docx** files
- **including all of your images**.

Please keep in mind that it will not loop through your recycle bin and starred folder.

## Get started

You can find the app at [mindactuate.github.io/quip-exporter](https://mindactuate.github.io/quip-exporter).

<img src="/public/Video_Quip-Exporter.gif">

## About me and ref to Github

My name is Daniel, I am a software engineer from Germany. Find me at Github under [github.com/mindactuate](https://github.com/mindactuate) or at dev.to under [dev.to/mindactuate](https://dev.to/mindactuate).

Or you can send me an email to dnlgrnr911 at gmail.com.

## Donating and a star

[<img src="/public/icon_donate.png" width=128>](https://www.paypal.me/mindactuate)

This app is a lot of work. Please consider donating just a little. :) You can [paypal me](https://www.paypal.me/mindactuate). That´s an effort of 5 seconds.

Further I would be very happy about a Github star from you. :)

## Tech Stack

- [Quip](https://quip.com/) the "thing" it's all about
- [ReactJS](https://reactjs.org/) and [create-react-app](https://www.npmjs.com/package/create-react-app)
- [react-easy-state](https://github.com/RisingStack/react-easy-state), an amazing simple state management tool for ReactJS
- [patiently](https://github.com/mindactuate/patiently), my own tool, which I have written especially for the Quip Exporter, but which is now used in many projects
- [Cloudflare workers](https://workers.cloudflare.com/) for the CORS proxy (but I am in contact with Quip, perhaps I'll get a CORS trust)
- [axios](https://github.com/axios/axios)
- [file-saver](https://github.com/eligrey/FileSaver.js)
- [turndown](https://github.com/domchristie/turndown)