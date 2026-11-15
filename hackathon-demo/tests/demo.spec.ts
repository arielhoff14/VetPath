import {test,expect} from '@playwright/test';
test('owner and clinic sessions share the synthetic workflow',async({browser})=>{
 const ownerContext=await browser.newContext({baseURL:'http://127.0.0.1:4317'}),staffContext=await browser.newContext({baseURL:'http://127.0.0.1:4317'});const owner=await ownerContext.newPage(),staff=await staffContext.newPage();
 try{await owner.goto('/');await expect(owner.getByText('27 reference listings')).toBeVisible();await owner.getByRole('button',{name:'Send a sample request'}).click();await expect(owner.locator('#demo-provider')).toContainText('Your sample request',{timeout:15000});
  await staff.goto('/');await staff.getByRole('button',{name:'For clinics'}).click();await expect(staff.getByText('submitted',{exact:true})).toBeVisible();await staff.getByRole('button',{name:'Acknowledge',exact:true}).click();await expect(owner.locator('#demo-provider')).toContainText('acknowledged',{timeout:15000});
  await staff.getByLabel('Simulated staff role').selectOption('manager');await staff.getByRole('button',{name:'Availability',exact:false}).click();await staff.getByRole('button',{name:'Restricted · call first'}).click();await expect(owner.locator('#demo-provider')).toContainText('Restricted — call first (simulated)',{timeout:15000});
 }finally{await ownerContext.close();await staffContext.close();}
});
