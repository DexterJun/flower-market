<template>
  <div class="flower-market-promotion">
    <van-nav-bar title="898艺术园区花卉市场招商" fixed />
    
    <div class="content">
      <img style="width: 100%;" src="../../../assets/images/bg.png" alt="">
      
      <section v-for="(section, index) in sections" :key="index" :class="['section', `section-${index + 1}`]">
        <h2>{{ section.title }}</h2>
        <div v-if="Array.isArray(section.content)">
          <p v-for="(item, itemIndex) in section.content" :key="itemIndex">{{ item }}</p>
        </div>
        <div v-else>
          <p>{{ section.content }}</p>
        </div>
      </section>

      <section class="section section-contact">
        <h2>联系我们</h2>
        <p>招商热线：13681113555</p>
        <p>地址：北京市朝阳区东风南路898号</p>
        <van-button type="primary" block @click="showToast('感谢您的关注，我们会尽快与您联系！')">
          立即咨询
        </van-button>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { showToast } from 'vant';
import 'vant/lib/index.css';

const sections = ref([
  {
    title: '项目概况',
    content: [
      '898艺术园区花卉市场总建筑面积达50,000平方米，位于北京市朝阳区东风南路898号。',
      '项目采用全景落地玻璃幕墙设计，引入自然采光，打造明亮通透的高端经营环境。',
      '空间灵活可变，根据商户需求量身定制经营面积，充分满足不同业态发展需求。'
    ]
  },
  {
    title: '区位优势',
    content: [
      '高端商圈  澎湃人潮---园区周边分布泛海国际、御翠园等多个知名高端住宅社区，常住人口密集且消费能力强。毗邻朝阳公园、东风公园等城市核心绿地，优美的自然环境为花卉市场带来更多潜在客户群体，尤其是热爱园艺和花艺的高品质生活人群。',
      '便捷交通  财富通道---园区紧邻北京朝阳站，周边交通便捷，连接城市核心区域，吸引更多商务人群与游客客流。',
      '艺术共生  前景广阔---园区周边与798艺术区文化氛围相得益彰，打造独特的艺术生态圈，吸引热爱艺术、设计、文化创意的高端客群。此外，项目作为区域内特色花卉市场，将成为消费升级的重要目的地，填补市场空白，具备强大的成长潜力。'
    ]
  },
  {
    title: '园区规划',
    content: '898园区旨在打造一座融合文创办公、精品零售、特色餐饮、精品酒店及休闲娱乐于一体的城市创新生活综合体。以花卉产业为特色引擎，通过业态的深度融合与创新组合，打造独特的商业生态圈，为具有前瞻眼光的投资者提供持续增长的发展机遇。'
  },
  {
    title: '经营优势',
    content: [
      '规模效应：50,000平米超大经营面积，汇聚百余品类花卉商户，形成完整产业链',
      '空间灵活：20-100㎡铺位任你选择，满足不同经营需求',
      '硬件升级：全玻璃幕墙设计，尊贵大气，为花卉展示提供最佳环境',
      '品牌聚集：严选优质商户，打造花卉行业标杆市场',
      '配套完善：园区配备停车场、装卸区、物业服务等专业配套设施'
    ]
  },
  {
    title: '运营支持',
    content: [
      '精英团队：核心管理团队常年服务世界500强企业，拥有丰富的大客户服务经验与资源整合能力',
      '营销推广：定期举办花艺展览、花卉交易会等特色活动，提升市场知名度',
      '物业服务：专业物业团队，为商户提供全方位服务保障'
    ]
  },
  {
    title: '优惠政策',
    content: [
      '首批60名入驻商户享受2个月免租优惠',
      '租金优惠：5.8-7.8元/平米/天，极具竞争力的价格',
      '装修补贴：符合条件的商户可享受装修补贴',
      '推广支持：优先享受市场统一推广资源'
    ]
  },
  {
    title: '招商业态',
    content: ['鲜花', '绿植', '花鸟鱼虫', '工艺品']
  }
]);
</script>

<style scoped>
.flower-market-promotion {
  padding-top: 46px;
  padding-bottom: 20px;
  background-color: #f0f8ff;
  font-family: 'Arial', sans-serif;
}

.content {
  padding: 16px;
}

.section {
  margin-bottom: 24px;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.section h2 {
  font-size: 20px;
  color: #333;
  margin-bottom: 16px;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 8px;
}

.section p {
  font-size: 14px;
  line-height: 1.6;
  color: #666;
  margin-bottom: 8px;
}

.section-1 { background-color: #E8F5E9; }
.section-2 { background-color: #F1F8E9; }
.section-3 { background-color: #FFFDE7; }
.section-4 { background-color: #FFF3E0; }
.section-5 { background-color: #FBE9E7; }
.section-6 { background-color: #E3F2FD; }
.section-7 { background-color: #E0F2F1; }

.section-contact {
  background-color: #EFEBE9;
}

.section-contact .van-button {
  margin-top: 16px;
}

@media (max-width: 600px) {
  .section {
    padding: 15px;
  }

  .section h2 {
    font-size: 18px;
  }

  .section p {
    font-size: 13px;
  }
}
</style>