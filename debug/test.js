console.log('尝试重现问题');  
try {  
  const Order = require('../hello_after/database/Order');  
  const routes = require('../hello_after/routes/orders');  
  console.log('导入成功');  
} catch (e) {  
  console.error('导入错误:', e.message);  
}  
