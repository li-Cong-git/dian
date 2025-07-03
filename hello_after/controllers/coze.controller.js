/**
 * Coze工作流控制器
 */
const cozeService = require('../services/coze.service');

/**
 * 执行Coze工作流
 * @param {Object} req - 请求对象，应包含执行工作流所需的参数
 * @param {Object} res - 响应对象
 */
exports.executeWorkflow = async (req, res) => {
  try {
    const { inputs } = req.body;
    
    if (!inputs) {
      return res.status(400).json({
        success: false,
        message: '缺少必要的输入参数'
      });
    }

    // 调用Coze服务
    const result = await cozeService.executeWorkflow(inputs);
    
    // 返回结果，保持原始响应格式
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('执行工作流错误:', error);
    res.status(500).json({
      success: false,
      message: '工作流执行失败',
      error: error.message
    });
  }
};

/**
 * 获取Coze工作流信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getWorkflowInfo = async (req, res) => {
  try {
    // 调用Coze服务获取机器人信息
    const botInfo = await cozeService.getWorkflowInfo();
    
    // 返回结果
    res.json({
      success: true,
      data: botInfo
    });
  } catch (error) {
    console.error('获取机器人信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取机器人信息失败',
      error: error.message
    });
  }
}; 