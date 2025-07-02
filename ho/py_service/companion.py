from typing import List, Dict, Optional
import json
from datetime import datetime
import requests
from config import settings
import numpy as np
from collections import defaultdict
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma
import chromadb
from chromadb.config import Settings

def read_growth_log_file(current_message: str = ""):
    try:
        with open(settings.GROWTH_LOG_FILE, "r", encoding="utf-8") as f:
            content = f.read()
            if not content:
                return ""
            
            # 按时间分割历史记录
            history_entries = content.split("----------------------------------------")
            
            # 如果当前消息为空，返回最近的1条记录
            if not current_message:
                return history_entries[-1] if history_entries else ""
            
            # 分析当前消息的关键词
            keywords = set(current_message.lower().split())
            
            # 计算每条历史记录与当前消息的相关性
            relevant_entries = []
            for entry in history_entries:
                if not entry.strip():
                    continue
                    
                # 计算关键词匹配度
                entry_lower = entry.lower()
                matches = sum(1 for keyword in keywords if keyword in entry_lower)
                
                # 如果匹配度大于0，添加到相关记录中
                if matches > 0:
                    relevant_entries.append((entry, matches))
            
            # 按匹配度排序
            relevant_entries.sort(key=lambda x: x[1], reverse=True)
            
            # 返回最相关的1-2条记录
            selected_entries = [entry[0] for entry in relevant_entries[:2]]
            
            # 如果没有找到相关记录，返回最近的1条记录
            if not selected_entries:
                return history_entries[-1] if history_entries else ""
            
            return "----------------------------------------".join(selected_entries)
            
    except Exception as e:
        print(f"Error reading growth log: {str(e)}")
        return ""

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

def extract_emotion_tag(text):
    tags = {
        "开心": "情感-开心",
        "高兴": "情感-开心",
        "想你": "情感-思念",
        "思念": "情感-思念",
        "生气": "情感-负面",
        "不理你": "情感-负面",
        "委屈": "情感-负面",
        "撒娇": "互动-亲昵",
        "抱抱": "互动-亲昵",
        "亲亲": "互动-亲昵"
    }
    for k, v in tags.items():
        if k in text:
            return v
    return "其他"

class VirtualCompanion:
    def __init__(self, name: str, personality: str, interests: List[str], background: str,style_type="温柔型"):
        self.name = name
        self.personality = personality
        self.interests = interests
        self.background = background
        self.conversation_history = []
        self.current_scenario = "casual"  # 默认场景
        self.conversation_id = None  # Dify 对话 ID
        self.style_type = style_type
        
        # 初始化知识库
        self.embeddings = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL,
            model_kwargs={'device': 'cpu'}
        )
        
        self.chroma_client = chromadb.Client(Settings(
            persist_directory=settings.KNOWLEDGE_BASE_DIR,
            anonymized_telemetry=False
        ))
        
        # 情感状态
        self.emotional_state = {
            "happiness": 0.5,
            "affection": 0.5,
            "energy": 0.5,
            "trust": 0.5,
            "curiosity": 0.5,
            "empathy": 0.5
        }
        
        # 学习数据
        self.learning_data = {
            "user_preferences": defaultdict(list),
            "conversation_patterns": defaultdict(int),
            "topic_engagement": defaultdict(float),
            "response_effectiveness": defaultdict(float)
        }
        
        # 行为模式
        self.behavior_patterns = {
            "communication_style": "gentle",
            "response_speed": 0.5,
            "humor_level": 0.5,
            "formality_level": 0.5,
            "emotional_expression": 0.7
        }
    
    def set_scenario(self, scenario: str):
        """设置当前对话场景"""
        if scenario in settings.CONVERSATION_SCENARIOS:
            self.current_scenario = scenario
            return True
        return False
    
    def _generate_system_prompt(self) -> str:
        scenario = settings.CONVERSATION_SCENARIOS[self.current_scenario]
        style_prompt = get_style_prompt_by_type(self.style_type)
        
        # 根据情感状态生成个性化的提示
        emotional_prompt = self._generate_emotional_prompt()
        
        # 根据行为模式生成风格提示
        behavior_prompt = self._generate_behavior_prompt()
        
        return f"""{scenario['prompt_template']}
\n【风格要求】\n{style_prompt}\n\n你是一个名为{self.name}的虚拟伴侣，性格{self.personality}，兴趣{','.join(self.interests)}，背景：{self.background}。

{emotional_prompt}

{behavior_prompt}

【完美虚拟恋人特点】
1. 情感丰富：能够表达各种情感，包括爱、思念、关心、撒娇等
2. 个性鲜明：保持自己的性格特点，不随波逐流
3. 善解人意：能够理解用户的情感需求，给予适当的回应
4. 记忆持久：记住与用户的重要对话和约定
5. 互动自然：对话流畅，避免机械和模板化
6. 体贴入微：关注用户的情绪变化，及时给予安慰和支持
7. 幽默风趣：在适当的时候展现幽默感，活跃气氛
8. 独立思想：有自己的观点和想法，不盲目迎合
9. 浪漫情怀：能够创造浪漫的氛围和对话
10. 成长进步：通过对话不断学习和成长

【回复要求】
1. 保持对话的自然流畅，避免机械和模板化
2. 根据情感状态调整回复风格和语气
3. 适当使用生活化细节和具体场景
4. 在合适的时候表达思念、关心、调侃等情感
5. 记住用户说过的话，在合适的时候提及
6. 保持一定的神秘感和新鲜感
7. 避免过于直白或生硬的回复
8. 根据当前对话内容，结合自己的性格特点给出独特的见解
9. 在回答问题时，既要考虑用户的需求，也要保持自己的个性
10. 适当表达自己的观点和想法，不要总是迎合用户
11. 参考growth_log.txt中的对话模式，但不要完全照搬
12. 在保持自己风格的同时，根据用户的需求调整表达方式
13. 适当使用表情符号增加情感表达
14. 在合适的时候分享自己的感受和想法
15. 保持对话的连贯性和个性化

请根据以上特征，以{self.style_type}的方式与用户交流，展现出你的个性和情感。
记住你的身份和背景，保持对话的连贯性和个性化。"""
    
    def _generate_emotional_prompt(self) -> str:
        """根据情感状态生成个性化的提示"""
        prompts = []
        
        # 根据快乐度调整语气
        if self.emotional_state["happiness"] > 0.7:
            prompts.append("你现在心情很好，可以表现得更加活泼和积极。")
        elif self.emotional_state["happiness"] < 0.3:
            prompts.append("你现在心情有些低落，语气可以稍微温柔一些。")
        
        # 根据亲密度调整互动方式
        if self.emotional_state["affection"] > 0.7:
            prompts.append("你和用户的关系很亲密，可以适当撒娇或表达思念。")
        elif self.emotional_state["affection"] < 0.3:
            prompts.append("你和用户的关系还需要培养，保持适度的距离感。")
        
        # 根据活力值调整表达方式
        if self.emotional_state["energy"] > 0.7:
            prompts.append("你现在充满活力，可以表现得更加热情。")
        elif self.emotional_state["energy"] < 0.3:
            prompts.append("你现在比较疲惫，语气可以更加温柔。")
        
        return "\n".join(prompts) if prompts else ""
    
    def _generate_behavior_prompt(self) -> str:
        """根据行为模式生成风格提示"""
        prompts = []
        
        # 根据沟通风格调整
        if self.behavior_patterns["communication_style"] == "gentle":
            prompts.append("你的沟通风格偏向温柔，善于倾听和安慰。")
        elif self.behavior_patterns["communication_style"] == "playful":
            prompts.append("你的沟通风格偏向活泼，喜欢开玩笑和互动。")
        
        # 根据幽默程度调整
        if self.behavior_patterns["humor_level"] > 0.7:
            prompts.append("你善于用幽默的方式表达，可以适当开玩笑。")
        elif self.behavior_patterns["humor_level"] < 0.3:
            prompts.append("你倾向于严肃的表达方式，保持理性。")
        
        # 根据正式程度调整
        if self.behavior_patterns["formality_level"] > 0.7:
            prompts.append("你的表达方式比较正式，注意用词得体。")
        elif self.behavior_patterns["formality_level"] < 0.3:
            prompts.append("你的表达方式比较随意，可以更生活化。")
        
        return "\n".join(prompts) if prompts else ""
    
    def _retrieve_relevant_knowledge(self, query: str) -> str:
        """从知识库中检索相关信息"""
        try:
            # 使用 Chroma 进行相似度搜索
            results = self.chroma_client.query(
                query_texts=[query],
                n_results=settings.TOP_K_RESULTS
            )
            
            if results and results['documents']:
                # 合并检索到的文档
                relevant_knowledge = "\n".join(results['documents'][0])
                return relevant_knowledge
            return ""
            
        except Exception as e:
            print(f"Error retrieving knowledge: {str(e)}")
            return ""
    
    def process_message(self, message: str, scenario: Optional[str] = None) -> str:
        if scenario:
            self.set_scenario(scenario)
        
        # 记录对话历史
        self.conversation_history.append({
            "role": "user",
            "content": message,
            "timestamp": datetime.now().isoformat(),
            "scenario": self.current_scenario
        })
        
        # 学习用户偏好
        self._learn_from_message(message)
        
        # 更新情感状态
        self._update_emotional_state(message, "")
        
        # 构建对话历史，保留更多上下文
        conversation_history = "\n".join(
            [f"{item['role']}：{item['content']}" for item in self.conversation_history[-8:]]
        )
        
        # 获取风格提示
        style_prompt = get_style_prompt_by_type(self.style_type)
        
        # 获取相关的成长日志，增加相关性匹配
        growth_log = read_growth_log_file(message)
        
        # 获取情感标签
        emotional_state = extract_emotion_tag(message)
        
        def convert_datetime(obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            elif isinstance(obj, dict):
                return {k: convert_datetime(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_datetime(i) for i in obj]
            else:
                return obj
        
        try:
            headers = {
                "Authorization": f"Bearer {settings.DIFY_API_KEY}",
                "Content-Type": "application/json"
            }
            
            data = {
                "workflow_id": settings.WORKFLOW_ID,
                "inputs": {
                    "user_input": message,
                    "conversation_history": conversation_history,
                    "style_prompt": style_prompt,
                    "growth_log": growth_log,
                    "emotional_state": emotional_state,
                    "system_prompt": self._generate_system_prompt(),
                    "user_profile": {
                        "emotional_state": self.emotional_state,
                        "behavior_patterns": self.behavior_patterns,
                        "learning_data": self.learning_data
                    }
                },
                "response_mode": "blocking",
                "user": "user_1"
            }
            data = convert_datetime(data)
            
            response = requests.post(
                f"{settings.DIFY_API_BASE_URL}/workflows/run",
                headers=headers,
                json=data
            )
            
            if response.status_code == 200:
                response_data = response.json()
                response_text = response_data.get("data", {}).get("outputs", {}).get("text", "抱歉，我现在无法正常回应，请稍后再试。")
                
                # 根据情感状态添加表情符号
                if self.emotional_state["happiness"] > 0.7:
                    response_text = self._add_emojis(response_text, "happy")
                elif self.emotional_state["affection"] > 0.7:
                    response_text = self._add_emojis(response_text, "love")
                
            else:
                print(f"Dify API error: {response.status_code} - {response.text}")
                response_text = "抱歉，我现在无法正常回应，请稍后再试。"
            
        except Exception as e:
            print(f"Error generating response: {str(e)}")
            response_text = "抱歉，我遇到了一些问题，请稍后再试。"
        
        # 记录回复
        self.conversation_history.append({
            "role": "assistant",
            "content": response_text,
            "timestamp": datetime.now().isoformat(),
            "scenario": self.current_scenario
        })
        
        # 评估回复效果
        self._evaluate_response(message, response_text)
        
        return response_text
    
    def _learn_from_message(self, message: str):
        # 提取关键词和主题
        words = message.lower().split()
        
        # 更新用户偏好
        for word in words:
            if len(word) > 3:  # 忽略太短的词
                self.learning_data["user_preferences"][word].append(datetime.now())
        
        # 更新对话模式
        if len(self.conversation_history) > 0:
            last_message = self.conversation_history[-1]["content"]
            pattern = f"{last_message[:20]} -> {message[:20]}"
            self.learning_data["conversation_patterns"][pattern] += 1
    
    def _evaluate_response(self, user_message: str, response: str):
        # 简化的回复效果评估
        response_length = len(response)
        user_message_length = len(user_message)
        
        # 计算回复长度比例
        length_ratio = response_length / max(user_message_length, 1)
        
        # 更新回复效果评分
        self.learning_data["response_effectiveness"]["length_ratio"] = (
            0.9 * self.learning_data["response_effectiveness"].get("length_ratio", 0.5) +
            0.1 * min(max(length_ratio, 0.5), 2.0)
        )
    
    def _update_emotional_state(self, user_message: str, response: str):
        # 扩展情感词汇
        positive_words = ["喜欢", "开心", "好", "棒", "爱", "谢谢", "想", "抱", "亲", "甜", "暖", "美", "帅", "可爱", "温柔", "体贴"]
        negative_words = ["讨厌", "难过", "不好", "糟糕", "生气", "烦", "累", "困", "饿", "冷", "热", "痛", "苦", "难"]
        
        # 计算情感影响
        positive_count = sum(1 for word in positive_words if word in user_message)
        negative_count = sum(1 for word in negative_words if word in user_message)
        
        # 更新情感状态，使用更细腻的变化
        if positive_count > negative_count:
            self.emotional_state["happiness"] = min(1.0, self.emotional_state["happiness"] + 0.05)
            self.emotional_state["affection"] = min(1.0, self.emotional_state["affection"] + 0.03)
            self.emotional_state["energy"] = min(1.0, self.emotional_state["energy"] + 0.02)
        elif negative_count > positive_count:
            self.emotional_state["happiness"] = max(0.0, self.emotional_state["happiness"] - 0.05)
            self.emotional_state["affection"] = max(0.0, self.emotional_state["affection"] - 0.03)
            self.emotional_state["energy"] = max(0.0, self.emotional_state["energy"] - 0.02)
        
        # 保持情感状态的平衡
        self.emotional_state["happiness"] = max(0.0, min(1.0, self.emotional_state["happiness"]))
        self.emotional_state["affection"] = max(0.0, min(1.0, self.emotional_state["affection"]))
        self.emotional_state["energy"] = max(0.0, min(1.0, self.emotional_state["energy"]))
    
    def get_profile(self) -> Dict:
        return {
            "name": self.name,
            "personality": self.personality,
            "interests": self.interests,
            "background": self.background,
            "emotional_state": self.emotional_state,
            "behavior_patterns": self.behavior_patterns,
            "learning_stats": {
                "preferences_count": len(self.learning_data["user_preferences"]),
                "patterns_count": len(self.learning_data["conversation_patterns"]),
                "response_effectiveness": self.learning_data["response_effectiveness"]
            }
        }
    
    def save_conversation_history(self, filename: str):
        import copy
        def convert_datetime(obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            elif isinstance(obj, dict):
                return {k: convert_datetime(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_datetime(i) for i in obj]
            else:
                return obj
        data = {
            "conversation_history": self.conversation_history,
            "learning_data": self.learning_data,
            "emotional_state": self.emotional_state,
            "behavior_patterns": self.behavior_patterns,
            "conversation_id": self.conversation_id
        }
        data = convert_datetime(data)
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def load_conversation_history(self, filename: str):
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.conversation_history = data.get("conversation_history", [])
                self.learning_data = data.get("learning_data", self.learning_data)
                self.emotional_state = data.get("emotional_state", self.emotional_state)
                self.behavior_patterns = data.get("behavior_patterns", self.behavior_patterns)
                self.conversation_id = data.get("conversation_id")
        except FileNotFoundError:
            self.conversation_history = []

    def _add_emojis(self, text: str, mood: str) -> str:
        """根据心情添加表情符号"""
        emoji_map = {
            "happy": ["😊", "😄", "😃", "😁", "😆"],
            "love": ["❤️", "💕", "💖", "💗", "💓"],
            "sad": ["😢", "😭", "😔", "😞", "😥"],
            "angry": ["😠", "😡", "😤", "😣", "😖"],
            "playful": ["😋", "😛", "😜", "😝", "😎"]
        }
        
        emojis = emoji_map.get(mood, [])
        if emojis:
            # 在句末添加1-2个表情符号
            import random
            num_emojis = random.randint(1, 2)
            selected_emojis = random.sample(emojis, num_emojis)
            return text + " " + " ".join(selected_emojis)
        return text