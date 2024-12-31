// 定义表单的状态枚举  
const FormStatus = {  
    PRISTINE: 'pristine', // 初始状态，未填写任何内容  
    DIRTY: 'dirty',       // 用户开始填写内容  
    VALID: 'valid',       // 表单验证通过  
    INVALID: 'invalid'    // 表单验证失败  
  };  
    
  // 表单状态管理类  
  class FormStateManager {  
    constructor(form) {  
      this.form = form;  
      this.status = FormStatus.PRISTINE;  
      this.listeners = {};  
    }  
    
    // 订阅状态变化事件  
    subscribe(status, callback) {  
      if (!this.listeners[status]) {  
        this.listeners[status] = [];  
      }  
      this.listeners[status].push(callback);  
    }  
    
    // 触发状态变化事件  
    notify(status) {  
      if (this.listeners[status]) {  
        this.listeners[status].forEach(callback => callback());  
      }  
    }  
    
    // 更新表单状态并触发相应事件  
    updateStatus(newStatus) {  
      if (this.status !== newStatus) {  
        this.status = newStatus;  
        this.notify(newStatus);  
      }  
    }  
    
    // 根据表单内容设置状态  
    setStatusBasedOnFormContent() {  
      // 假设这里有一个validateForm函数用于验证表单内容  
      //const isValid = validateForm(this.form);  
      //const isValid=true;
      const isValid=false;
      if (this.form.username || this.form.password || this.form.email) {  
        this.updateStatus(isValid ? FormStatus.VALID : FormStatus.INVALID);  
      } else {  
        this.updateStatus(FormStatus.PRISTINE);  
      }  
    }  
  }  
    
  // 示例用法  
  const form = {  
    username: '',  
    password: '',  
    email: ''  
  };  
    
  const formStateManager = new FormStateManager(form);  
    
  // 订阅状态变化事件  
  formStateManager.subscribe(FormStatus.VALID, () => {  
    console.log('表单验证通过，可以提交');  
  });  
    
  formStateManager.subscribe(FormStatus.INVALID, () => {  
    console.log('表单验证失败，请检查填写内容');  
  });  
    
  // 假设用户在某个输入框中输入内容  
  form.username = 'testUser';  
    
  // 更新并通知状态变化  
  formStateManager.setStatusBasedOnFormContent(); // 输出：表单验证失败，请检查填写内容  
    
  // 用户继续填写其他字段直到表单验证通过  
  form.password = 'testPass';  
  form.email = 'test@example.com';  
  formStateManager.setStatusBasedOnFormContent(); // 输出：表单验证通过，可以提交
  