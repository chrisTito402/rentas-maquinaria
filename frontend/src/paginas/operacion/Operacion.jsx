import { useEffect, useRef, useState } from 'react';
import DatePicker from '../../componentes/operacion/DatePicker.jsx';
import { INVENTORY } from '@compartido/operacion/operaciones.js';
const paths={plus:'M12 5v14 M5 12h14',grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',inbox:'M4 4h16v16H4z M4 13h5l2 3h2l2-3h5',calendar:'M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16 M8 14h2 M14 14h2 M8 17h2',tool:'m14 6-8 8-3 7 7-3 8-8 M14 6l1-4 3 4 4 1-4 4 M3 3l5 5 M3 3v4l3 3',truck:'M3 6h11v12H3z M14 10h4l3 4v4h-7 M6 18a2 2 0 1 0 0 .1 M17 18a2 2 0 1 0 0 .1',search:'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14 M15 15l6 6',arrow:'M4 12h16 M14 6l6 6-6 6',back:'M20 12H4 M10 6l-6 6 6 6',chevron:'m9 5 7 7-7 7',clock:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20 M12 6v6l4 2',check:'m5 12 4 4L20 5',file:'M5 3h9l5 5v13H5z M14 3v6h5 M8 13h8 M8 17h6',user:'M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M4 22v-3a8 8 0 0 1 16 0v3',bell:'M5 16h14l-2-3V8a5 5 0 0 0-10 0v5z M10 20h4',menu:'M3 6h18 M3 12h18 M3 18h18',close:'m5 5 14 14 M19 5 5 19',filter:'M3 5h18 M6 12h12 M10 19h4',pin:'M12 22s8-8 8-14A8 8 0 0 0 4 8c0 6 8 14 8 14 M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6',info:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20 M12 11v6 M12 7h.01',help:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20 M9 8a3 3 0 1 1 4 3v3 M12 18h.01',print:'M6 9V3h12v6 M6 17H3V9h18v8h-3 M6 14h12v7H6z',box:'M3 7l9-5 9 5v10l-9 5-9-5z M3 7l9 5 9-5 M12 12v10',swap:'M3 7h17l-4-4 M21 17H4l4 4',download:'M12 3v12 M7 10l5 5 5-5 M4 17v4h16v-4',phone:'M6 3l4 5-3 3 6 6 3-3 5 4-3 3C9 22 2 15 3 6z'};
function Icon({name,size=20,...props}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]||paths.box}/></svg>}
const dateText=(value)=>value?new Date(value+'T12:00:00').toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'}):'Sin registrar';
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
function Badge({state}){return <span className={'badge '+({'Disponible':'green','En renta':'green','En preparación':'amber','Apartado':'blue','En revisión':'amber','En mantenimiento':'red','Fuera de servicio':'red','Cerrada':'muted'}[state]||'muted')}><i/>{state}</span>}
function Field({label,children,wide=false}){return <label className={wide?'field wide':'field'}><span>{label}</span>{children}</label>}
function Empty({title='No hay registros',text='Los registros aparecerán aquí cuando avance la operación.'}){return <div className="empty"><span className="empty-icon"><Icon name="inbox" size={30}/></span><h3>{title}</h3><p>{text}</p></div>}

function ModalBackdrop({ children, onClose, printing = false }) {
  return <div className={'modal-backdrop' + (printing ? ' printing' : '')}>
    <button type="button" className="modal-backdrop-close" tabIndex={-1} aria-label="Cerrar ventana" onClick={onClose} />
    {children}
  </div>;
}

const modalLabels={prepare:['Registrar preparación','Pega aquí el resultado de la revisión del mecánico.'],document:['Generar carta responsiva','Revisa los datos del equipo antes de generar la carta.'],deliver:['Registrar entrega','Confirma la entrega física del equipo al cliente.'],signature:['Registrar firma de responsiva','Registra que recibiste la carta impresa y firmada.'],installation:['Registrar instalación','Completa este paso solo cuando la entrega requiera instalación.'],issue:['Reportar falla','La falla queda relacionada con esta renta.'],review:['Registrar revisión con el cliente','Pega aquí el resultado de la revisión con el cliente.'],collection:['Coordinar recolección','Guarda lo acordado con el cliente para recoger el equipo.'],return:['Registrar devolución','El equipo pasará a En revisión al registrar su regreso.'],close:['Registrar estado final','El administrador registra el resultado de la revisión del mecánico.']};
function Modal({kind,rental,unit,error,busy=false,onClose,onSubmit}){
  const ref=useRef();const [result,setResult]=useState('Disponible');const [docPrint,setDocPrint]=useState(false);
  useEffect(()=>{const before=document.activeElement;ref.current?.focus();const key=e=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const items=ref.current?.querySelectorAll('button:not(:disabled), input, select, textarea, [tabindex="0"]');if(!items?.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};document.addEventListener('keydown',key);document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',key);document.body.style.overflow='';before?.focus()}},[onClose]);
  useEffect(()=>{const fn=()=>setDocPrint(false);window.addEventListener('afterprint',fn);return()=>window.removeEventListener('afterprint',fn)},[]);
  const submit = event => {
    event.preventDefault();
    if (busy) return;
    const datos = new FormData(event.currentTarget);
    const campos = Object.fromEntries(datos);
    if (kind === 'document') campos.inventory = datos.getAll('inventory');
    onSubmit(kind, campos);
  };
  if(kind==='help')return <ModalBackdrop onClose={onClose}><section className="modal help-modal" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="help-title"><button className="icon-button modal-close" aria-label="Cerrar" onClick={onClose}><Icon name="close"/></button><p className="eyebrow">PRIMEROS PASOS</p><h2 id="help-title">Una renta, de principio a fin</h2><p>Abre un apartado y registra la preparación. Cuando el equipo esté listo, registra la entrega. Puedes adjuntar la fotografía de la responsiva cuando la recibas.</p><p>Las reservaciones llegan de Comercial. Después de la entrega, registra la devolución y la revisión final.</p><footer className="modal-footer"><button className="button dark" onClick={onClose}>Entendido<Icon name="check" size={17}/></button></footer></section></ModalBackdrop>;
  if(kind==='photo') return <PhotoUpload rental={rental} error={error} busy={busy} dialogRef={ref} onClose={onClose} onSave={fields=>onSubmit('photo',fields)}/>;
  if(kind==='photoPreview') return <ModalBackdrop onClose={onClose}><section className="modal document-modal" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="photo-preview-title"><div className="document-toolbar"><strong id="photo-preview-title">Foto de la responsiva</strong><button className="button dark compact" onClick={()=>window.print()}><Icon name="print" size={17}/>Imprimir</button><button className="icon-button" aria-label="Cerrar fotografía" onClick={onClose}><Icon name="close"/></button></div><div className="photo-sheet"><img src={rental.documentPhoto.image} alt={'Responsiva de '+rental.id}/></div></section></ModalBackdrop>;
  if(kind==='preview')return <ModalBackdrop onClose={onClose} printing={docPrint}><section className="modal document-modal" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="document-title"><div className="document-toolbar"><span>Vista de impresión · {rental.document.folio}</span><button className="button dark compact" onClick={()=>{setDocPrint(true);window.print()}}><Icon name="print" size={17}/>Imprimir</button><button className="icon-button" aria-label="Cerrar documento" onClick={onClose}><Icon name="close"/></button></div><article className="responsiva"><header><div className="brand-symbol"><Icon name="tool" size={26}/></div><div><h2 id="document-title">RESPONSIVA DE EQUIPO</h2><p>Renta de Maquinaria</p></div><strong>{rental.document.folio}</strong></header><table><tbody>{[['Fecha de entrega',dateText(rental.delivery?.date||rental.document.date)],['Cliente',rental.client],['Dirección fiscal',rental.document.direccionFiscal||rental.address],['Dirección de entrega',rental.address],['Contacto',`${rental.contact} · ${rental.phone}`],['Equipo',`${unit.id} · ${unit.name}`],['Marca y modelo',`${unit.brand} · ${unit.model}`],['Número de serie',unit.serial],['Periodo de renta',`${dateText(rental.start)} al ${dateText(rental.end)}`],['Horómetro',`${rental.document.hours} horas`]].map(([label,value])=><tr key={label}><th>{label}</th><td>{value}</td></tr>)}</tbody></table><h3>Inventario de entrega</h3>{rental.document.inventory?.length ? <ul className="printed-inventory">{INVENTORY.map(item=><li key={item}>{rental.document.inventory.includes(item)?'☑':'☐'} {item}</li>)}</ul> : <p>Consultar el inventario de la revisión del mecánico.</p>}{rental.document.notes&&<p><b>Observaciones</b><br/>{rental.document.notes}</p>}<h3>Nota de responsabilidad</h3><p className="responsibility">LOS DAÑOS OCASIONADOS POR NEGLIGENCIA DERIVADOS DEL TRABAJO PARA EL CUAL SE RENTO EL MONTACARGAS, SERAN TOTALMENTE CUBIERTOS POR CUENTA DEL CLIENTE EL CUAL FIRMA DE RECIBIDO EN BUENAS CONDICIONES DE FUNCIONAMIENTO.</p><div className="signature-lines"><div>Nombre y firma de quien recibe</div><div>Nombre y firma de quien entrega</div></div></article></section></ModalBackdrop>;
  const [title,description]=modalLabels[kind];return <ModalBackdrop onClose={onClose}><section className="modal" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="icon-button modal-close" aria-label="Cerrar formulario" onClick={onClose}><Icon name="close"/></button><p className="eyebrow">{rental.id} · {unit.id}</p><h2 id="modal-title">{title}</h2><p className="modal-description">{description}</p><div className="modal-unit"><Icon name="box"/><div><strong>{unit.name}</strong><small>{rental.client}</small></div><Badge state={unit.state}/></div><form onSubmit={submit} aria-busy={busy}><fieldset disabled={busy} className="operation-fields"><div className="form-grid">
  {['deliver','signature','installation','collection','return','document'].includes(kind)&&<DatePicker name="date" label={kind==='collection'?'Fecha acordada':'Fecha'} defaultValue={kind==='collection'?rental.collection?.date||today():today()}/>}
  {kind==='collection'&&<Field label="Hora acordada"><input name="time" type="time" defaultValue={rental.collection?.time||'10:00'} required/></Field>}
  {['prepare','review','close'].includes(kind)&&<Field label="Mecánico que revisó" wide><input name="mechanic" placeholder="Nombre del mecánico" defaultValue={kind==='prepare'?rental.preparedBy:''} required/></Field>}
  {kind==='prepare'&&<><Field label="Resultado de la revisión" wide><select name="result" defaultValue={rental.ready?'ready':'progress'}><option value="progress">Continuar en preparación</option><option value="ready">Equipo listo para entrega</option><option value="maintenance">Necesita mantenimiento</option></select></Field><Field label="Resultado de la revisión del mecánico" wide><textarea name="notes" defaultValue={rental.preparation} placeholder="Pega aquí el resultado de la revisión" required/></Field></>}
  {kind==='document'&&<><Field label="Lectura del horómetro"><input name="hours" type="number" min="0" step="0.1" defaultValue={unit.hours} required/></Field><Field label="Dirección fiscal" wide><input name="direccionFiscal" defaultValue={rental.address} required/></Field><Field label="Marca"><input name="brand" defaultValue={unit.brand} required/></Field><Field label="Serie"><input name="serial" defaultValue={unit.serial} required/></Field></>}
  {kind === 'document' && <fieldset className="field wide">
    <legend>Inventario de entrega</legend>
    {INVENTORY.map(item => <label className="checkbox-row" key={item}>
      <input type="checkbox" name="inventory" value={item}
        defaultChecked={(rental.document?.inventory ?? rental.inventory ?? []).includes(item)} />{item}
    </label>)}
  </fieldset>}
  {['deliver','return'].includes(kind)&&<Field label={kind==='deliver'?'Nombre de quien recibe con el cliente':'Nombre de quien recibe el regreso'} wide><input name="receiver" required placeholder="Nombre completo"/></Field>}
  {kind==='signature'&&<><Field label="Nombre de quien firmó" wide><input name="name" required placeholder="Nombre completo"/></Field><div className="wide"><label className="checkbox-row"><input type="checkbox" required/>Confirmo que recibí la responsiva impresa y firmada.</label></div></>}
  {kind==='collection'&&<Field label="Contacto para la recolección" wide><input name="contact" defaultValue={rental.collection?.contact||rental.contact} required/></Field>}
  {kind==='close'&&<><Field label="Estado final del equipo" wide><select name="result" value={result} onChange={e=>setResult(e.target.value)}><option>Disponible</option><option>En mantenimiento</option><option>Fuera de servicio</option></select></Field>{result==='Fuera de servicio'&&<Field label="Persona de Gerencia que autorizó la baja" wide><input name="authorization" required/></Field>}</>}
  {kind!=='prepare'&&<Field label={{issue:'Descripción de la falla',review:'Resultado de la revisión del mecánico',installation:'Resultado de la instalación',close:'Resultado de la revisión final',collection:'Dirección e indicaciones de recolección'}[kind]||'Observaciones'} wide><textarea name="notes" required={['issue','review','installation','close'].includes(kind)} defaultValue={kind==='collection'?rental.collection?.notes||rental.address:''} placeholder={['review','close'].includes(kind) ? 'Pega aquí el resultado de la revisión' : 'Escribe la información de esta operación'}/></Field>}
  </div>{error&&<div className="alert" role="alert">{error}</div>}<footer className="modal-footer"><button className="button soft" type="button" onClick={onClose}>Cancelar</button><button className="button dark" type="submit">{busy?'Guardando...':kind==='document'?'Generar responsiva':kind==='deliver'?'Confirmar entrega':'Guardar registro'}<Icon name="arrow" size={17}/></button></footer></fieldset></form></section></ModalBackdrop>
}

function RentalSummary({ rental, unit }) {
  return <section className="panel simple-summary">
    <div className="summary-top"><div><span className="summary-label">Equipo</span><h2>{unit.name}</h2><span className="summary-id mono">{unit.id}</span></div><Badge state={unit.state}/></div>
    <dl className="summary-facts">
      <div><dt>Cliente</dt><dd>{rental.client}</dd></div>
      <div><dt>{rental.delivery ? 'Entrega registrada' : 'Entrega prevista'}</dt><dd>{dateText(rental.delivery?.date || rental.start)}</dd></div>
      <div><dt>Regreso previsto</dt><dd>{dateText(rental.end)}</dd></div>
    </dl>
    {rental.collection && rental.status==='En renta' && <div className="simple-reminder"><Icon name="truck" size={18}/><span>Recolección el <strong>{dateText(rental.collection.date)}</strong> a las {rental.collection.time}</span></div>}
    <details className="additional-details"><summary>Ver datos completos<Icon name="chevron" size={15}/></summary><div className="additional-body">
      <dl className="data-list"><div><dt>Contacto</dt><dd>{rental.contact} · {rental.phone}</dd></div><div><dt>Dirección de entrega</dt><dd>{rental.address}</dd><small>{rental.site}</small></div><div><dt>Folio de renta / Cotización</dt><dd>{rental.id} / {rental.commercial}</dd></div><div><dt>Marca, modelo y serie</dt><dd>{unit.brand} · {unit.model} · {unit.serial}</dd></div><div><dt>Horómetro</dt><dd>{rental.document?.hours ?? unit.hours} h</dd></div>
      {rental.preparation&&<div><dt>Revisión antes de salir</dt><dd>{rental.preparation}</dd><small>{rental.preparedBy}</small></div>}
      {rental.delivery&&<div><dt>Entrega</dt><dd>{dateText(rental.delivery.date)} · Recibió {rental.delivery.receiver}</dd></div>}
      {rental.signature&&<div><dt>Responsiva firmada</dt><dd>{rental.signature.name} · {dateText(rental.signature.date)}</dd></div>}
      {rental.installation&&<div><dt>Instalación</dt><dd>{rental.installation.notes}</dd></div>}
      {rental.collection&&<div><dt>Recolección</dt><dd>{rental.collection.contact} · {rental.collection.notes}</dd></div>}
      {rental.return&&<div><dt>Regreso registrado</dt><dd>{dateText(rental.return.date)} · Recibió {rental.return.receiver}</dd><small>{rental.return.notes}</small></div>}
      {rental.finalReview&&<div><dt>Revisión final</dt><dd>{rental.finalReview.notes}</dd><small>{rental.finalReview.mechanic}</small></div>}
      </dl>
    </div></details>
  </section>;
}
function RentalActions({rental,unit,onAction}) {
  let primary;
  let others=[];
  if (['Apartado','En preparación'].includes(rental.status)) {
    primary = !rental.ready ? ['prepare','Registrar preparación','Registra lo que revisó el mecánico.'] : ['deliver','Registrar entrega','Confirma que el cliente recibió el equipo.'];
    if(rental.ready)others.push(['prepare','Actualizar preparación'], ['document','Generar carta responsiva']);
    if(rental.documentPhoto)others.push(['photo','Cambiar foto de responsiva']);
  } else if(rental.status==='En renta') {
    primary = ['return','Registrar devolución','Registra el regreso cuando el equipo llegue.'];
  } else if(rental.status==='En revisión') {
    primary=['close','Registrar estado final','Registra el resultado de la revisión del mecánico.'];
  } else if(rental.status==='En mantenimiento') {
    primary=['prepare','Retomar preparación','Cuando termine la reparación, registra la nueva revisión del mecánico. La entrega seguirá detenida hasta que el equipo esté listo.'];
  }
  return <section className="panel simple-actions">
    {!rental.document&&!rental.documentPhoto&&<div className="simple-reminder document-pending"><Icon name="file" size={18}/><span>Responsiva pendiente de adjuntar</span><button className="button soft compact" onClick={()=>onAction('photo')}>Adjuntar responsiva</button></div>}
    <div className="next-step"><div><h2>{rental.status==='Cerrada'?'Renta terminada':rental.status==='En mantenimiento'?'Equipo en mantenimiento':'Siguiente paso'}</h2><p>{primary?.[2] || (rental.status==='Cerrada'?'El equipo quedó '+unit.state.toLowerCase()+'.':'La entrega queda detenida hasta que el equipo esté listo.')}</p></div>{primary&&<button className="button dark" onClick={()=>onAction(primary[0])}>{primary[1]}<Icon name="arrow" size={17}/></button>}</div>
    {others.length>0&&<details className="additional-details other-actions"><summary>Otras acciones<Icon name="chevron" size={15}/></summary><div className="additional-body">{others.map(([action,label])=><button className="button soft" key={action} onClick={()=>onAction(action)}>{label}<Icon name="arrow" size={15}/></button>)}</div></details>}
  </section>;
}

function RentalDocuments({rental,onAction}) {
  const hasPhoto=!!rental.documentPhoto;
  return <section className="panel">
    <div className="panel-heading"><div><h2>Responsiva</h2><p>Genera, imprime o adjunta la carta de la renta.</p></div><button className="button dark" onClick={()=>onAction('photo')}><Icon name="file" size={17}/>{hasPhoto?'Cambiar foto':'Subir fotografía'}</button></div>
    {rental.status==='En preparación'&&rental.ready&&<button className="button soft" onClick={()=>onAction('document')}>Generar carta responsiva</button>}
    {hasPhoto&&<div className="document-row"><button className="photo-thumbnail" onClick={()=>onAction('photoPreview')} aria-label="Ampliar foto de la responsiva"><img src={rental.documentPhoto.image} alt="Foto de la responsiva"/></button><div><h3>Fotografía de la responsiva</h3><p>{dateText(rental.documentPhoto.date)}</p><Badge state={rental.signature?'Firmada':'Firma pendiente'}/></div><button className="button soft" onClick={()=>onAction('photoPreview')}>Ver fotografía<Icon name="arrow" size={17}/></button></div>}
    {rental.document&&<div className="document-row"><span className="document-icon"><Icon name="file" size={26}/></span><div><h3>Carta generada</h3><p>{rental.document.folio} · {dateText(rental.document.date)}</p></div><button className="button soft" onClick={()=>onAction('preview')}>Ver documento<Icon name="arrow" size={17}/></button></div>}
    {!hasPhoto&&!rental.document&&<Empty title="Responsiva pendiente de adjuntar" text="Puedes agregar la fotografía cuando la recibas. Esto no impide registrar la entrega."/>}
  </section>;
}
function readPhoto(file, type) {
  const readError = 'No se pudo abrir la fotografía. Prueba con otra imagen.';
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(readError));
    reader.onabort = reader.onerror;
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(readError));
      image.src = reader.result;
    };
    reader.readAsDataURL(file.type === type ? file : file.slice(0, file.size, type));
  });
}

async function preparePhoto(file) {
  const extensions = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const extension = file.name.split('.').at(-1).toLowerCase();
  const type = !file.type || file.type === 'application/octet-stream' ? extensions[extension] : file.type;
  if (!Object.values(extensions).includes(type)) throw Error('Selecciona una foto JPG, PNG o WebP.');
  if (file.size > 20 * 1024 * 1024) throw Error('La fotografía es muy grande. Selecciona una de menos de 20 MB.');

  const photo = await readPhoto(file, type);
  const scale = Math.min(1, 1800 / Math.max(photo.naturalWidth, photo.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(photo.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(photo.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw Error('No se pudo abrir la fotografía.');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(photo, 0, 0, canvas.width, canvas.height);

  const maxLength = 1100000;
  let image = canvas.toDataURL('image/jpeg', 0.86);
  for (const quality of [0.76, 0.66, 0.56, 0.46]) {
    if (image.length <= maxLength) break;
    image = canvas.toDataURL('image/jpeg', quality);
  }
  if (image.length > maxLength) throw Error('La fotografía ocupa mucho espacio. Prueba con una imagen más pequeña.');
  return image;
}
function PhotoUpload({rental,error,busy=false,dialogRef,onClose,onSave}) {
  const [photo,setPhoto]=useState(null);const [loading,setLoading]=useState(false);const [photoError,setPhotoError]=useState('');const sequence=useRef(0);
  useEffect(()=>()=>{sequence.current++},[]);
  const select=async e=>{
    const input=e.currentTarget;const file=input.files?.[0];if(!file)return;
    input.value='';
    const token=++sequence.current;setLoading(true);setPhoto(null);setPhotoError('');
    try {const image=await preparePhoto(file);if(sequence.current===token)setPhoto({image,name:file.name});}
    catch(err){if(sequence.current===token)setPhotoError(err.message||'No se pudo abrir la fotografía. Prueba con otra imagen.');}
    finally {if(sequence.current===token)setLoading(false);}
  };
  return <ModalBackdrop onClose={onClose}><section className="modal" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="upload-title">
    <button className="icon-button modal-close" onClick={onClose} aria-label="Cerrar"><Icon name="close"/></button><p className="eyebrow">{rental.id}</p><h2 id="upload-title">Foto de la responsiva</h2><p className="modal-description">Incluye toda la hoja y revisa que el texto se lea.</p>
    <div className="photo-upload-area">{photo?<img className="photo-upload-preview" src={photo.image} alt="Vista previa de la foto seleccionada"/>:<div className="photo-upload-empty"><Icon name="file" size={34}/><p>{loading?'Preparando fotografía…':'Selecciona una fotografía'}</p></div>}
    <div className="photo-pickers"><label className="button soft photo-picker">{photo?'Elegir otra foto':'Elegir fotografía'}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={select} disabled={loading||busy}/></label><label className="button soft photo-picker camera-picker">Tomar foto<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={select} disabled={loading||busy}/></label></div></div>
    {(photoError||error)&&<div className="alert" role="alert">{photoError||error}</div>}
    <footer className="modal-footer"><button className="button soft" onClick={onClose}>Cancelar</button><button className="button dark" disabled={!photo||loading||busy} onClick={()=>onSave({image:photo.image,name:photo.name,date:today()})}>Guardar fotografía<Icon name="check" size={17}/></button></footer>
  </section></ModalBackdrop>;
}

export { Modal, RentalSummary, RentalActions, RentalDocuments };
