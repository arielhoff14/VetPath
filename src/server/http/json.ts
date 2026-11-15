/** Read a bounded request body even if Content-Length is absent or misleading. */
export async function readBytesLimited(request:Request,maxBytes:number):Promise<Uint8Array>{
 const length=request.headers.get('content-length');if(length&&Number(length)>maxBytes)throw Error('Request too large');
 if(!request.body)throw Error('Missing request body');const reader=request.body.getReader();const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw Error('Request too large');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}return bytes;
}
export async function readJsonLimited(request:Request,maxBytes:number):Promise<unknown>{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await readBytesLimited(request,maxBytes)));}
