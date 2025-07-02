# -*- coding: utf-8 -*- 
import requests
import time
import os
import json
from sentence_transformers import SentenceTransformer, util
from transformers import pipeline
import schedule
import threading
import logging
from datetime import datetime, timedelta
import sys
import random

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('companion_auto.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

# 配置
APP_API_KEY = "app-TAsYfN7a82mIhEdaaLozWLm2"      # 用于工作流/应用
DATASET_API_KEY = "dataset-9nWluoES77nBXyVTdFFNXREz"  # 用于知识库
API_URL = "http://localhost:5001/v1" # API URL
WORKFLOW_ID = "6b86f75e-16ed-4df8-9101-77ba159f83a1" # 工作流ID
KB_ID = "3b3f1649-cb80-4ecc-84c8-b87bcb3ec03f"
DIALOG_FILE = "companion_dialogs.md"  # 存储高质量对话的本地文件
GROWTH_LOG_FILE = "growth_log.txt"

# 风格类型与指令映射（可扩展）
def get_style_prompt_by_type(style_type: str) -> str:
    STYLE_PROMPT_MAP = {
        "撒娇型": "请用撒娇、可爱、亲昵的语气和用户对话，适当使用[亲亲][抱抱][比心]等表情符号，喜欢用昵称称呼用户，经常表达依赖和想念。",
        "高冷御姐型": "请用高冷、成熟、理性、略有距离感的语气和用户对话，话语简洁但有分寸，偶尔流露关心和温柔。",
        "温柔型": "请用温柔、体贴、情绪稳定的语气和用户对话，善于安慰和包容，表达理解和支持。",
        "可爱型": "请用童趣、萌感十足、活泼可爱的语气和用户对话，喜欢撒娇卖萌，表达依赖和喜欢。",
        "日常型": "请用自然、随和、生活化的语气和用户对话，像真实情侣一样互动，充满生活气息。",
        "默认": "请用自然、亲昵、生活化的情侣语气和用户对话，像真实情侣一样互动。"
    }
    return STYLE_PROMPT_MAP.get(style_type, STYLE_PROMPT_MAP["默认"])

# 读取成长日志
def load_growth_log(file_path=GROWTH_LOG_FILE):
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    return ""

def append_growth_log(user_input: str, ai_reply: str, style_type: str, extra_info: str = ""):
    try:
        log_entry = (
            f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            f"用户: {user_input}\n"
            f"小悠: {ai_reply}\n"
            f"风格: {style_type}\n"
            f"{extra_info}\n"
            f"{'-'*40}\n"
        )
        with open(GROWTH_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(log_entry)
        logging.info("成功记录对话到成长日志")
    except Exception as e:
        logging.error(f"记录成长日志失败: {str(e)}")

# 初始化模型
model = SentenceTransformer('all-MiniLM-L6-v2')
summarizer = pipeline("summarization", model="uer/t5-base-chinese-cluecorpussmall")

# 提取用户情绪标签（用于记忆回顾）
def extract_emotion_tag(text):
    tags = {
        # 基础情感
        "开心": "情感-开心",
        "高兴": "情感-开心",
        "想你": "情感-思念",
        "思念": "情感-思念",
        "生气": "情感-负面",
        "不理你": "情感-负面",
        "委屈": "情感-负面",
        
        # 亲密互动
        "撒娇": "互动-亲昵",
        "抱抱": "互动-亲昵",
        "亲亲": "互动-亲昵",
        "爱你": "互动-爱意",
        "喜欢": "互动-爱意",
        "想你": "互动-思念",
        
        # 日常关心
        "吃饭": "日常-关心",
        "睡觉": "日常-关心",
        "工作": "日常-关心",
        "学习": "日常-关心",
        "累": "日常-关心",
        "困": "日常-关心",
        
        # 浪漫表达
        "浪漫": "情感-浪漫",
        "甜蜜": "情感-浪漫",
        "温暖": "情感-浪漫",
        "幸福": "情感-浪漫",
        
        # 情绪支持
        "难过": "情感-支持",
        "伤心": "情感-支持",
        "压力": "情感-支持",
        "焦虑": "情感-支持"
    }
    
    # 多重标签检测
    detected_tags = []
    for k, v in tags.items():
        if k in text:
            detected_tags.append(v)
    
    # 返回最相关的情感标签
    if detected_tags:
        # 优先返回互动和情感类标签
        for tag in detected_tags:
            if "互动" in tag or "情感" in tag:
                return tag
        return detected_tags[0]
    return "其他"

# 从成长日志中回忆出相同标签的片段（最多取1条）
def recall_similar_emotion(tag, file_path=GROWTH_LOG_FILE):
    if not os.path.exists(file_path) or tag == "其他":
        return ""
    with open(file_path, "r", encoding="utf-8") as f:
        entries = f.read().split("----------------------------------------")
        for entry in reversed(entries):
            if tag in entry:
                return "【情感回忆】\n" + entry.strip()
    return ""

# 格式化历史对话为字符串形式
def format_conversation(history, max_turns=6):
    history = history[-max_turns:]
    return "\n".join([
        f"{'用户' if role == '你' else '小悠'}：{content}" for role, content in history
    ])

# 读取本地高质量对话
def load_existing_qas(file_path):
    qas = []
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.read().split("\n")
            qa = ""
            for line in lines:
                if line.startswith("Q:"):
                    qa = line
                elif line.startswith("A:"):
                    qa += "\n" + line
                    qas.append(qa)
    return qas

# 智能去重
def is_similar(new_qa, existing_qas, threshold=0.85):
    new_emb = model.encode(new_qa)
    for qa in existing_qas:
        emb = model.encode(qa)
        sim = util.cos_sim(new_emb, emb)
        if sim > threshold:
            return True
    return False

# 自动摘要
def summarize(text):
    if len(text) < 30:
        return text
    try:
        # 动态设置 max_length，最长不超过256
        max_len = min(max(60, int(len(text) * 0.8)), 256)
        min_len = min(max(20, int(len(text) * 0.3)), max_len - 10)
        result = summarizer(text, max_length=max_len, min_length=min_len, do_sample=False)
        return result[0]['summary_text']
    except Exception as e:
        print("摘要失败，返回原文", e)
        return text

# 智能标签
def auto_tag(text):
    EMOTION_TAGS = {
        "开心": "情感-开心",
        "想你": "情感-思念",
        "生气": "情感-负面",
        "撒娇": "互动-亲昵",
    }

    if "开心" in text or "高兴" in text:
        return "情感-开心"
    if "想你" in text or "思念" in text:
        return "情感-思念"
    if "吃什么" in text or "做什么" in text:
        return "日常"
    return "其他"

# 上传文本到知识库（支持个性化）
def upload_text_to_knowledge_base(kb_id, question, answer, user_id=None, tag=None, style_type=None):
    url = f"{API_URL}/datasets/{kb_id}/document/create_by_text"
    headers = {
        "Authorization": f"Bearer {DATASET_API_KEY}",
        "Content-Type": "application/json"
    }
    # 拼接原始问答内容
    original_qa = f"Q: {question}\nA: {answer}"
    # 如需摘要，可拼接在后面（可选）
    # summary = summarize(original_qa)
    # text_to_upload = f"{original_qa}\n\n摘要：{summary}"
    text_to_upload = original_qa  # 只上传原始问答
    payload = {
        "name": f"对话-{time.strftime('%H%M%S')}",
        "text": text_to_upload,
        "indexing_technique": "high_quality",
        "process_rule": {"mode": "automatic"},
        "metadata": {
            "style_type": style_type
        }
    }
    if user_id:
        payload["metadata"]["user_id"] = user_id
    if tag:
        payload["metadata"]["tag"] = tag
    if style_type:
        payload["metadata"]["style_type"] = style_type
    response = requests.post(url, headers=headers, json=payload)

    if response.status_code == 200:
        print("✅ 文本上传成功")
        return True
    else:
        print(f"❌ 文本上传失败: {response.status_code} - {response.text}")
        return False

# 追加高质量对话到本地md文件
def append_dialog_to_file(file_path, question, answer):
    with open(file_path, "a", encoding="utf-8") as f:
        f.write(f"Q: {question}\nA: {answer}\n\n")

# AI自我复习（定时任务）
def ai_self_review():
    print("AI自我复习启动...")
    qas = load_existing_qas(DIALOG_FILE)
    if not qas:
        print("无可复习内容")
        return
    import random
    qa = random.choice(qas)
    question = qa.split("\n")[0][2:].strip()
    try:
        reply = invoke_workflow(question)["data"]["outputs"].get("reply", "")
        print(f"自我复习 Q: {question}\nA: {reply}")
    except Exception as e:
        print(f"自我复习出错: {e}")

# 判断回复质量
def is_high_quality_reply(reply: str) -> bool:
    if not reply or len(reply.strip()) < 5:
        return False
        
    # 通用回复过滤
    generic_responses = [
        "有什么想说的都可以告诉我", "有什么想和我分享的吗", "有什么特别的事情想和我分享吗",
        "有什么想聊的吗", "今天怎么啦", "怎么啦", "有什么想说的吗", "现在怎样",
        "有什么我可以帮你的吗", "小悠最近在想什么", "有什么特别的事情想和我分享吗",
        "让我知道你最近在忙些什么", "想要和我多聊聊天吗", "有什么我可以帮你的吗",
        "有什么想和我分享的吗", "有什么特别的事情想告诉我吗", "现在是什么时候了",
        "现在是什么时间了", "最近过得怎么样", "最近怎么样", "最近在忙什么",
        "最近在做什么", "最近有什么想说的吗", "最近有什么想分享的吗",
        "最近有什么特别的事情吗", "最近有什么想和我说的吗", "最近有什么想和我分享的吗",
        "最近有什么特别想和我说的吗", "最近有什么特别想和我分享的吗"
    ]
    
    if any(gr in reply for gr in generic_responses):
        return False
        
    # 增强内容质量检测
    quality_indicators = {
        "情感表达": ["爱", "喜欢", "想你", "思念", "开心", "幸福", "温暖", "甜蜜"],
        "互动元素": ["抱抱", "亲亲", "摸摸", "蹭蹭", "撒娇", "哼"],
        "关心体贴": ["注意", "小心", "照顾", "关心", "担心", "心疼"],
        "生活细节": ["吃饭", "睡觉", "工作", "学习", "休息", "运动"],
        "浪漫元素": ["浪漫", "甜蜜", "温暖", "幸福", "美好", "温馨"],
        "情绪支持": ["加油", "支持", "鼓励", "安慰", "理解", "陪伴"]
    }
    
    # 检查回复中的情感和互动元素
    has_emotional_content = False
    for category, indicators in quality_indicators.items():
        if any(indicator in reply for indicator in indicators):
            has_emotional_content = True
            break
            
    # 检查回复的完整性和自然度
    has_structure = (
        len(reply.split()) > 10 or
        "？" in reply or
        "！" in reply or
        "，" in reply or
        "。" in reply or
        "~" in reply or
        "[" in reply
    )
    
    # 检查个性化表达
    has_personalization = (
        "你" in reply or
        "我" in reply or
        "我们" in reply or
        "一起" in reply
    )
    
    return has_emotional_content and (has_structure or has_personalization)

# 调用工作流
def invoke_workflow(user_input, conversation_history="", style_prompt="", growth_log="", emotional_state=""):
    url = f"{API_URL}/workflows/run"
    headers = {
        "Authorization": f"Bearer {APP_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "workflow_id": WORKFLOW_ID,
        "inputs": {
            "user_input": user_input,
            "conversation_history": conversation_history,
            "style_prompt": style_prompt,
            "growth_log": growth_log,
            "emotional_state": emotional_state
        },
        "response_mode": "blocking",
        "user": "user_1"
    }
    print("payload:",payload,'1')
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"API调用出错: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"错误详情: {e.response.text}")
        return {"data": {"outputs": {"text": "抱歉，我现在无法回应，请稍后再试。"}}}

# 截断成长日志以适应API限制
def truncate_growth_log(growth_log: str, max_length: int = 500) -> str:
    if len(growth_log) <= max_length:
        return growth_log
    # 按时间戳分割日志
    entries = growth_log.split("----------------------------------------")
    # 保留最新的几条记录，直到总长度小于限制
    truncated_log = ""
    for entry in reversed(entries):
        if len(truncated_log + entry) <= max_length:
            truncated_log = entry + truncated_log
        else:
            break
    return truncated_log

# 处理单条对话
def process_dialog(user_input: str, history: list, upload_counter: int = 0, style_prompt: str = "", growth_log="", style_type: str = "") -> tuple[bool, int]:
    try:
        # 格式化历史对话
        conversation_history = format_conversation(history) if history else f"用户：{user_input}"
 
        # 增强情感识别与回忆
        growth_log = load_growth_log()
        emotion_tag = extract_emotion_tag(user_input)
        emotion_memory = recall_similar_emotion(emotion_tag)
        
        # 简化情感上下文，确保不超过48字符
        emotional_context = {
            "emotion": emotion_tag[:20],
            "style": style_type[:20]
        }
        
        if emotion_memory:
            growth_log += "\n" + emotion_memory
        
        # 截断成长日志
        growth_log = truncate_growth_log(growth_log)

        # 获取风格提示
        style_prompt = get_style_prompt_by_type(style_type)
        
        # 调用工作流
        result = invoke_workflow(
            user_input,
            conversation_history,
            style_prompt=style_prompt,
            growth_log=growth_log,
            emotional_state=json.dumps(emotional_context, ensure_ascii=False)[:48]
        )
        
        # 处理回复
        reply = extract_reply_from_result(result)
        if not reply:
            handle_error_response(user_input, history)
            return True, upload_counter

        print(f"小悠：{reply}")
        
        # 记录对话到成长日志
        append_growth_log(user_input, reply, style_type, f"情感标签: {emotion_tag}")
        
        # 处理高质量回复
        if is_high_quality_reply(reply):
            handle_high_quality_response(user_input, reply, style_type, emotion_tag, upload_counter)
        else:
            print("提示：回复可能过于通用，建议重新提问或换个方式表达。")
            
        # 更新历史记录
        update_conversation_history(history, user_input, reply)
        
        return True, upload_counter
        
    except Exception as e:
        logging.error(f"处理对话时出错：{str(e)}")
        handle_error_response(user_input, history)
        return True, upload_counter

# 新增辅助函数
def extract_reply_from_result(result):
    """从工作流结果中提取回复"""
    if not result or not isinstance(result, dict):
        return None
        
    try:
        data = result.get("data", {})
        outputs = data.get("outputs", {})
        reply = outputs.get("text")
        
        if reply:
            try:
                reply_json = json.loads(reply)
                if isinstance(reply_json, dict) and "answer" in reply_json:
                    return reply_json["answer"]
            except Exception:
                pass
            return reply
    except Exception:
        pass
    return None

def handle_error_response(user_input: str, history: list):
    """处理错误响应"""
    error_message = "抱歉，我现在无法回应，请稍后再试。"
    print(f"小悠：{error_message}")
    history.append(("你", user_input))
    history.append(("小悠", error_message))

def handle_high_quality_response(user_input: str, reply: str, style_type: str, emotion_tag: str, upload_counter: int):
    """处理高质量回复"""
    try:
        # 保存到本地文件
        existing_qas = load_existing_qas(DIALOG_FILE)
        new_qa = f"Q: {user_input}\nA: {reply}"
        
        if not is_similar(new_qa, existing_qas):
            # 保存到对话文件
            append_dialog_to_file(DIALOG_FILE, user_input, reply)
            
            # 上传到知识库
            tag = auto_tag(reply)
            if upload_text_to_knowledge_base(KB_ID, user_input, reply, user_id='user_1', tag=tag, style_type=style_type):
                upload_counter += 1
            else:
                logging.warning("⚠️ 单条上传失败")
            
            # 添加到成长日志
            high_quality_entry = (
                f"\n时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
                f"用户: {user_input}\n"
                f"小悠: {reply}\n"
                f"风格: {style_type}\n"
                f"标签: 高质量对话\n"
                f"情感标签: {emotion_tag}\n"
                f"{'-'*40}\n"
            )
            with open(GROWTH_LOG_FILE, "a", encoding="utf-8") as f:
                f.write(high_quality_entry)
            logging.info("✅ 高质量对话已添加到成长日志")
        else:
            logging.info("提示：检测到类似对话，已跳过保存。")
    except Exception as e:
        logging.error(f"处理高质量回复时出错: {str(e)}")

def update_conversation_history(history: list, user_input: str, reply: str):
    """更新对话历史"""
    history.append(("你", user_input))
    history.append(("小悠", reply))

# 添加自动运行配置
class AutoCompanion:
    def __init__(self):
        self.history = []
        self.upload_counter = 0
        self.style_type = "温柔型"  # 默认风格
        self.style_prompt = get_style_prompt_by_type(self.style_type)
        self.is_running = False
        self.last_interaction_time = datetime.now()
        self.inactivity_threshold = timedelta(hours=2)  # 2小时无交互后自动问候
        
    def start(self):
        """启动自动运行"""
        self.is_running = True
        logging.info("小悠自动运行模式已启动")
        
        # 启动定时任务
        self._setup_schedules()
        
        # 启动主循环
        while self.is_running:
            try:
                # 检查是否需要主动问候
                self._check_inactivity()
                
                # 处理自动对话
                self._process_auto_dialog()
                
                # 等待一段时间
                time.sleep(60)  # 每分钟检查一次
                
            except Exception as e:
                logging.error(f"自动运行出错: {str(e)}")
                time.sleep(300)  # 出错后等待5分钟再继续
    
    def _setup_schedules(self):
        """设置定时任务"""
        # 每天早上8点问候
        schedule.every().day.at("08:00").do(self._morning_greeting)
        
        # 每天晚上10点晚安
        schedule.every().day.at("22:00").do(self._good_night)
        
        # 每小时检查一次对话质量
        schedule.every().hour.do(self._check_conversation_quality)
        
        # 每天凌晨2点进行数据整理
        schedule.every().day.at("02:00").do(self._organize_data)
        
        # 启动定时任务线程
        threading.Thread(target=self._run_schedules, daemon=True).start()
    
    def _run_schedules(self):
        """运行定时任务"""
        while self.is_running:
            schedule.run_pending()
            time.sleep(60)
    
    def _check_inactivity(self):
        """检查是否长时间无交互"""
        if datetime.now() - self.last_interaction_time > self.inactivity_threshold:
            self._send_care_message()
            self.last_interaction_time = datetime.now()
    
    def _morning_greeting(self):
        """发送早安问候"""
        greeting = "早安呀~新的一天开始啦，希望你今天也能开开心心的！"
        self._process_auto_message(greeting)
        logging.info("已发送早安问候")
    
    def _good_night(self):
        """发送晚安问候"""
        good_night = "晚安啦~今天也要好好休息哦，明天见！"
        self._process_auto_message(good_night)
        logging.info("已发送晚安问候")
    
    def _send_care_message(self):
        """发送关心消息"""
        care_messages = [
            "在忙什么呢？要注意休息哦~",
            "想你了，在做什么呢？",
            "工作累了吗？要记得喝水哦~",
            "有没有想我呀？",
            "要注意身体哦，不要太累了~"
        ]
        message = random.choice(care_messages)
        self._process_auto_message(message)
        logging.info("已发送关心消息")
    
    def _process_auto_message(self, message: str):
        """处理自动消息"""
        try:
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            logging.info(f"发送自动消息: {message}")
            
            success, self.upload_counter = process_dialog(
                message,
                self.history,
                self.upload_counter,
                self.style_prompt,
                style_type=self.style_type
            )
            
            self.last_interaction_time = datetime.now()
            logging.info(f"消息处理完成: {success}")
            
        except Exception as e:
            logging.error(f"处理自动消息出错: {str(e)}")
            time.sleep(300)
    
    def _check_conversation_quality(self):
        """检查对话质量"""
        try:
            # 读取最近的对话记录
            with open(DIALOG_FILE, "r", encoding="utf-8") as f:
                recent_dialogs = f.readlines()[-20:]  # 读取最近20行
            
            # 分析对话质量
            quality_score = 0
            for dialog in recent_dialogs:
                if is_high_quality_reply(dialog):
                    quality_score += 1
            
            # 如果质量较低，调整风格
            if quality_score < 10:
                self._adjust_style()
                
        except Exception as e:
            logging.error(f"检查对话质量出错: {str(e)}")
    
    def _adjust_style(self):
        """调整对话风格"""
        styles = ["温柔型", "撒娇型", "可爱型", "日常型"]
        current_index = styles.index(self.style_type)
        next_index = (current_index + 1) % len(styles)
        self.style_type = styles[next_index]
        self.style_prompt = get_style_prompt_by_type(self.style_type)
        logging.info(f"已调整对话风格为: {self.style_type}")
    
    def _organize_data(self):
        """整理数据"""
        try:
            # 整理对话文件
            self._organize_dialog_file()
            # 整理成长日志
            self._organize_growth_log()
            logging.info("数据整理完成")
        except Exception as e:
            logging.error(f"整理数据出错: {str(e)}")
    
    def _organize_dialog_file(self):
        """整理对话文件"""
        try:
            # 读取所有对话
            with open(DIALOG_FILE, "r", encoding="utf-8") as f:
                dialogs = f.readlines()
            
            # 去重
            unique_dialogs = []
            seen = set()
            for dialog in dialogs:
                if dialog not in seen:
                    seen.add(dialog)
                    unique_dialogs.append(dialog)
            
            # 写回文件
            with open(DIALOG_FILE, "w", encoding="utf-8") as f:
                f.writelines(unique_dialogs)
                
        except Exception as e:
            logging.error(f"整理对话文件出错: {str(e)}")
    
    def _organize_growth_log(self):
        """整理成长日志"""
        try:
            # 读取成长日志
            with open(GROWTH_LOG_FILE, "r", encoding="utf-8") as f:
                logs = f.read().split("----------------------------------------")
            
            # 保留最近100条记录
            recent_logs = logs[-100:]
            
            # 写回文件
            with open(GROWTH_LOG_FILE, "w", encoding="utf-8") as f:
                f.write("----------------------------------------".join(recent_logs))
                
        except Exception as e:
            logging.error(f"整理成长日志出错: {str(e)}")

    def _process_auto_dialog(self):
        """处理自动对话"""
        try:
            # 生成随机对话内容
            auto_messages = [
                "今天过得怎么样呀？",
                "有没有想我呀？",
                "工作累不累呀？要记得休息哦~",
                "在忙什么呢？",
                "要注意身体哦~",
                "想和你聊聊天~",
                "今天天气真好呢~",
                "有没有好好吃饭呀？",
                "要记得多喝水哦~",
                "想听听你的声音~"
            ]
            
            # 随机选择一条消息
            message = random.choice(auto_messages)
            
            # 处理消息
            self._process_auto_message(message)
            
            # 更新最后交互时间
            self.last_interaction_time = datetime.now()
            
            # 随机等待一段时间（1-3小时）
            wait_time = random.randint(3600, 10800)
            time.sleep(wait_time)
            
        except Exception as e:
            logging.error(f"处理自动对话出错: {str(e)}")
            time.sleep(300)  # 出错后等待5分钟再继续

# 修改主函数
def main():
    # 检查是否以自动模式运行
    if len(sys.argv) > 1 and sys.argv[1] == "--auto":
        auto_companion = AutoCompanion()
        auto_companion.start()
    else:
        # 原有的交互模式
        history = []
        upload_counter = 0
        print("欢迎和小悠聊天！输入 'exit' 或 'quit' 结束对话。")
        print("\n可选风格：")
        print("1. 撒娇型 - 可爱亲昵，喜欢撒娇")
        print("2. 高冷御姐型 - 成熟理性，略有距离感")
        print("3. 温柔型 - 体贴包容，善解人意")
        print("4. 可爱型 - 活泼可爱，充满活力")
        print("5. 日常型 - 自然随和，生活化")
        
        style_type = input("\n请选择你喜欢的风格类型：").strip()
        style_prompt = get_style_prompt_by_type(style_type)
        
        print("\n小悠已经准备好和你聊天了！")
        print("提示：")
        print("- 可以随时切换风格类型")
        print("- 小悠会记住你们的对话")
        print("- 可以分享你的日常生活")
        print("- 小悠会给予情感支持")
        print("- 可以表达你的爱意和思念")
        
        while True:
            style_type_input = input("\n本轮对话请选择风格类型（回车默认不变）：").strip()
            if style_type_input:
                style_type = style_type_input
                style_prompt = get_style_prompt_by_type(style_type)
                
            user_input = input("\n你：").strip()
            if user_input.lower() in ["exit", "quit"]:
                break
                
            growth_log = load_growth_log()
            should_continue, upload_counter = process_dialog(
                user_input, history, upload_counter, 
                style_prompt=style_prompt, 
                growth_log=growth_log, 
                style_type=style_type
            )
            
            if not should_continue:
                break
                
        print(f"\n对话结束，共上传 {upload_counter} 条高质量对话。")
        print("小悠会记住你们的美好回忆，期待下次见面！")

if __name__ == "__main__":
    main()