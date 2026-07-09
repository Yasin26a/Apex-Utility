import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Eye, Settings, Smartphone, Monitor, Info, Sparkles, 
  Copy, Check, RefreshCw, AlertTriangle, CheckCircle2, Star, 
  HelpCircle, ChevronDown, ChevronUp, Link, Globe, Trash2,
  Target, Filter, TrendingUp, DollarSign, Plus, ArrowUpRight, BookOpen
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';

interface RichSnippetOptions {
  showStars: boolean;
  ratingValue: number;
  reviewCount: number;
  showDate: boolean;
  dateValue: string;
  showSitelinks: boolean;
  sitelinks: Array<{ title: string; url: string }>;
  showFaq: boolean;
  faqs: Array<{ question: string; answer: string }>;
}

interface SERPKeyword {
  keyword: string;
}

const KEYWORD_DATABASE: SERPKeyword[] = [
  { keyword: 'a google review' },
  { keyword: 'a search engine' },
  { keyword: 'a search engine optimization' },
  { keyword: 'about search engine optimization' },
  { keyword: 'add google seo to website' },
  { keyword: 'add in google' },
  { keyword: 'add in google search' },
  { keyword: 'add seo' },
  { keyword: 'add seo keywords to website' },
  { keyword: 'add seo to website' },
  { keyword: 'add your site to google' },
  { keyword: 'add your site to google search' },
  { keyword: 'add your url' },
  { keyword: 'add your url to google' },
  { keyword: 'add your website' },
  { keyword: 'add your website to google' },
  { keyword: 'add your website to google search' },
  { keyword: 'add your website to search engines' },
  { keyword: 'advanced seo tools' },
  { keyword: 'ai and seo' },
  { keyword: 'ai based seo tools' },
  { keyword: 'ai content' },
  { keyword: 'ai content and seo' },
  { keyword: 'ai content for seo' },
  { keyword: 'ai content optimization tools' },
  { keyword: 'ai content seo' },
  { keyword: 'ai content tools' },
  { keyword: 'ai for seo' },
  { keyword: 'ai for seo content' },
  { keyword: 'ai keyword research tool' },
  { keyword: 'ai powered seo' },
  { keyword: 'ai seo' },
  { keyword: 'ai seo analyzer' },
  { keyword: 'ai seo content' },
  { keyword: 'ai seo content writing' },
  { keyword: 'ai seo optimization' },
  { keyword: 'ai seo software' },
  { keyword: 'ai seo text' },
  { keyword: 'ai seo tools' },
  { keyword: 'ai seo writing' },
  { keyword: 'ai tool for content' },
  { keyword: 'ai tool for seo' },
  { keyword: 'ai tool to generate content' },
  { keyword: 'ai tools for content' },
  { keyword: 'ai tools for seo' },
  { keyword: 'ai tools in seo' },
  { keyword: 'ai writing seo' },
  { keyword: 'all about seo' },
  { keyword: 'all in seo' },
  { keyword: 'all seo tools' },
  { keyword: 'analyze site seo' },
  { keyword: 'analyze your website' },
  { keyword: 'analyzer seo' },
  { keyword: 'api keywords' },
  { keyword: 'api search engine' },
  { keyword: 'api to get google search results' },
  { keyword: 'appear on google' },
  { keyword: 'available search engines' },
  { keyword: 'basics of search engine optimization' },
  { keyword: 'best ai for seo' },
  { keyword: 'best ai seo' },
  { keyword: 'best ai seo tools' },
  { keyword: 'best ai tools for seo' },
  { keyword: 'best cheap seo tools' },
  { keyword: 'best content optimization tools' },
  { keyword: 'best for seo' },
  { keyword: 'best free it tools' },
  { keyword: 'best free keyword research tool for seo' },
  { keyword: 'best free seo' },
  { keyword: 'best free seo analysis tools' },
  { keyword: 'best free seo analyzer' },
  { keyword: 'best free seo checker' },
  { keyword: 'best free seo keyword research tools' },
  { keyword: 'best free seo software' },
  { keyword: 'best free seo tool for wordpress' },
  { keyword: 'best free seo tools' },
  { keyword: 'best free tools' },
  { keyword: 'best free website seo analysis tool' },
  { keyword: 'best free website seo checker' },
  { keyword: 'best google seo' },
  { keyword: 'best google seo tools' },
  { keyword: 'best local seo tools' },
  { keyword: 'best meta description for seo' },
  { keyword: 'best meta description generator' },
  { keyword: 'best meta tags for seo' },
  { keyword: 'best on page seo tools' },
  { keyword: 'best online seo tools' },
  { keyword: 'best search engine optimization' },
  { keyword: 'best seo' },
  { keyword: 'best seo ai' },
  { keyword: 'best seo ai tools' },
  { keyword: 'best seo analysis tools' },
  { keyword: 'best seo analyzer' },
  { keyword: 'best seo api' },
  { keyword: 'best seo apps' },
  { keyword: 'best seo checker free' },
  { keyword: 'best seo checker tool' },
  { keyword: 'best seo content tools' },
  { keyword: 'best seo description' },
  { keyword: 'best seo keyword research tools' },
  { keyword: 'best seo optimization' },
  { keyword: 'best seo optimization tools' },
  { keyword: 'best seo optimized website' },
  { keyword: 'best seo platforms' },
  { keyword: 'best seo research tool' },
  { keyword: 'best seo score checker' },
  { keyword: 'best seo search tools' },
  { keyword: 'best seo sites' },
  { keyword: 'best seo software' },
  { keyword: 'best seo tags' },
  { keyword: 'best seo title' },
  { keyword: 'best seo tools' },
  { keyword: 'best seo tools for beginners' },
  { keyword: 'best seo tools for blogger' },
  { keyword: 'best seo tools for content writing' },
  { keyword: 'best seo tools for ecommerce' },
  { keyword: 'best seo tools for free' },
  { keyword: 'best seo tools for keyword research' },
  { keyword: 'best seo tools for wordpress' },
  { keyword: 'best seo tools to use' },
  { keyword: 'best seo website' },
  { keyword: 'best seo website checker' },
  { keyword: 'best serp tool' },
  { keyword: 'best tool seo' },
  { keyword: 'best way to increase seo' },
  { keyword: 'best website for seo optimization' },
  { keyword: 'best website optimization tools' },
  { keyword: 'best website seo tools' },
  { keyword: 'blog optimization tool' },
  { keyword: 'blog seo optimization' },
  { keyword: 'blog seo tools' },
  { keyword: 'boost google ranking' },
  { keyword: 'boost google search' },
  { keyword: 'boost my seo' },
  { keyword: 'boost my website on google' },
  { keyword: 'boost seo' },
  { keyword: 'boost seo google' },
  { keyword: 'boost seo ranking' },
  { keyword: 'boost website on google' },
  { keyword: 'boost website seo' },
  { keyword: 'boost your seo' },
  { keyword: 'boost your website on google' },
  { keyword: 'boosting google search results' },
  { keyword: 'build seo' },
  { keyword: 'chatbot seo' },
  { keyword: 'cheap seo tool' },
  { keyword: 'check content for seo' },
  { keyword: 'check content seo' },
  { keyword: 'check free seo' },
  { keyword: 'check free website traffic' },
  { keyword: 'check google page rank' },
  { keyword: 'check google ranking of my website' },
  { keyword: 'check google seo score' },
  { keyword: 'check google serp' },
  { keyword: 'check meta description' },
  { keyword: 'check meta tags of website' },
  { keyword: 'check my google ranking' },
  { keyword: 'check my seo' },
  { keyword: 'check my seo position' },
  { keyword: 'check my seo score' },
  { keyword: 'check my serp' },
  { keyword: 'check my site seo' },
  { keyword: 'check my website for seo optimization' },
  { keyword: 'check my website google ranking' },
  { keyword: 'check my website seo ranking' },
  { keyword: 'check on page seo online' },
  { keyword: 'check out website traffic' },
  { keyword: 'check page meta description' },
  { keyword: 'check page seo online' },
  { keyword: 'check page seo score' },
  { keyword: 'check page traffic' },
  { keyword: 'check rank website google' },
  { keyword: 'check seo' },
  { keyword: 'check seo content' },
  { keyword: 'check seo for a website' },
  { keyword: 'check seo meta description' },
  { keyword: 'check seo of the website' },
  { keyword: 'check seo on a website' },
  { keyword: 'check seo page score' },
  { keyword: 'check seo ranking google' },
  { keyword: 'check seo rating' },
  { keyword: 'check seo report for website' },
  { keyword: 'check seo score for website' },
  { keyword: 'check seo score google' },
  { keyword: 'check seo score website' },
  { keyword: 'check seo website score' },
  { keyword: 'check serp' },
  { keyword: 'check site seo' },
  { keyword: 'check site seo online' },
  { keyword: 'check site seo score' },
  { keyword: 'check snippet google' },
  { keyword: 'check the seo of a website' },
  { keyword: 'check title and meta description' },
  { keyword: 'check traffic of any website' },
  { keyword: 'check website for seo google' },
  { keyword: 'check website google ranking' },
  { keyword: 'check website score' },
  { keyword: 'check website search engine visibility' },
  { keyword: 'check website seo' },
  { keyword: 'check website seo ranking' },
  { keyword: 'check website seo report' },
  { keyword: 'check website serp' },
  { keyword: 'check your google ranking' },
  { keyword: 'check your seo' },
  { keyword: 'check your site seo' },
  { keyword: 'check your website' },
  { keyword: 'check your website rank' },
  { keyword: 'check your website ranking' },
  { keyword: 'check your website ranking on google' },
  { keyword: 'check your website seo' },
  { keyword: 'check your website seo score' },
  { keyword: 'check your website traffic' },
  { keyword: 'checker tools website' },
  { keyword: 'chrome extension for seo tools' },
  { keyword: 'chrome extensions seo tools' },
  { keyword: 'click seo' },
  { keyword: 'content ai tools' },
  { keyword: 'content analysis tool' },
  { keyword: 'content checker seo tools' },
  { keyword: 'content optimization checker' },
  { keyword: 'content optimization tool' },
  { keyword: 'content optimizer' },
  { keyword: 'content review tool' },
  { keyword: 'content review tools' },
  { keyword: 'content seo' },
  { keyword: 'content seo checker free' },
  { keyword: 'content tools' },
  { keyword: 'core web vitals test google' },
  { keyword: 'core web vitals testing tool' },
  { keyword: 'counting characters google serp tool' },
  { keyword: 'create meta description' },
  { keyword: 'create seo' },
  { keyword: 'create seo report' },
  { keyword: 'ctr seo' },
  { keyword: 'description page' },
  { keyword: 'description tag' },
  { keyword: 'description tool' },
  { keyword: 'digital marketing and search engine optimization' },
  { keyword: 'digital marketing search engine optimization' },
  { keyword: 'digital marketing seo tools' },
  { keyword: 'doing seo on your own' },
  { keyword: 'domain authority checker google' },
  { keyword: 'domain authority checker tool' },
  { keyword: 'domain authority score checker' },
  { keyword: 'domain check seo' },
  { keyword: 'domain rank checker free' },
  { keyword: 'engine optimisation' },
  { keyword: 'engine optimization seo' },
  { keyword: 'enter your url' },
  { keyword: 'enter your website' },
  { keyword: 'evaluate your website' },
  { keyword: 'example of meta description for seo' },
  { keyword: 'example of seo description' },
  { keyword: 'examples of search engine marketing' },
  { keyword: 'examples of seo tools' },
  { keyword: 'extension for seo' },
  { keyword: 'extract google search results' },
  { keyword: 'facebook seo tools' },
  { keyword: 'featured snippet optimization' },
  { keyword: 'featured snippets' },
  { keyword: 'featured snippets example' },
  { keyword: 'featured snippets seo' },
  { keyword: 'first page of google search results' },
  { keyword: 'for search engine optimization' },
  { keyword: 'free content optimization tool' },
  { keyword: 'free google keyword research tool' },
  { keyword: 'free google keyword search tool' },
  { keyword: 'free google rank checker' },
  { keyword: 'free google rank checker tool' },
  { keyword: 'free google rank tracker' },
  { keyword: 'free google ranking checker' },
  { keyword: 'free google ranking tool' },
  { keyword: 'free google review' },
  { keyword: 'free google search' },
  { keyword: 'free google search engine' },
  { keyword: 'free google seo checker' },
  { keyword: 'free google seo keyword tool' },
  { keyword: 'free google seo ranking checker' },
  { keyword: 'free google tools' },
  { keyword: 'free google tools for seo' },
  { keyword: 'free google website ranking checker' },
  { keyword: 'free it tools' },
  { keyword: 'free online seo checker' },
  { keyword: 'free online seo optimization tools' },
  { keyword: 'free online seo tools for website analysis' },
  { keyword: 'free page rank checker' },
  { keyword: 'free rank checker' },
  { keyword: 'free rank checker tools' },
  { keyword: 'free search engine optimization' },
  { keyword: 'free seo' },
  { keyword: 'free seo ai' },
  { keyword: 'free seo ai tools' },
  { keyword: 'free seo analysis tools' },
  { keyword: 'free seo api' },
  { keyword: 'free seo app' },
  { keyword: 'free seo check' },
  { keyword: 'free seo checker' },
  { keyword: 'free seo checker for website' },
  { keyword: 'free seo checker google' },
  { keyword: 'free seo checker tools' },
  { keyword: 'free seo chrome extension' },
  { keyword: 'free seo content checker' },
  { keyword: 'free seo evaluation' },
  { keyword: 'free seo evaluation tool' },
  { keyword: 'free seo help' },
  { keyword: 'free seo keyword research' },
  { keyword: 'free seo keyword search tools' },
  { keyword: 'free seo meta description generator' },
  { keyword: 'free seo optimization checker' },
  { keyword: 'free seo optimization tools' },
  { keyword: 'free seo page checker' },
  { keyword: 'free seo platforms' },
  { keyword: 'free seo report tool' },
  { keyword: 'free seo research tools' },
  { keyword: 'free seo review' },
  { keyword: 'free seo review tools' },
  { keyword: 'free seo score' },
  { keyword: 'free seo score checker' },
  { keyword: 'free seo score tool' },
  { keyword: 'free seo search engine optimization' },
  { keyword: 'free seo search tools' },
  { keyword: 'free seo services' },
  { keyword: 'free seo site' },
  { keyword: 'free seo site checker' },
  { keyword: 'free seo software' },
  { keyword: 'free seo tester' },
  { keyword: 'free seo testing tools' },
  { keyword: 'free seo text checker' },
  { keyword: 'free seo tool checker' },
  { keyword: 'free seo tools' },
  { keyword: 'free seo tools api' },
  { keyword: 'free seo tools for beginners' },
  { keyword: 'free seo tools for content writing' },
  { keyword: 'free seo tools for keyword research' },
  { keyword: 'free seo tools for website' },
  { keyword: 'free seo tools for website analysis' },
  { keyword: 'free seo tools for wordpress' },
  { keyword: 'free seo tools google' },
  { keyword: 'free seo tools website' },
  { keyword: 'free seo traffic checker' },
  { keyword: 'free seo website' },
  { keyword: 'free serp' },
  { keyword: 'free serp analysis' },
  { keyword: 'free serp analysis tool' },
  { keyword: 'free serp checker' },
  { keyword: 'free serp checker tool' },
  { keyword: 'free serp tool' },
  { keyword: 'free tool for seo analysis' },
  { keyword: 'free tools' },
  { keyword: 'free web ranking checker' },
  { keyword: 'free website analysis for seo' },
  { keyword: 'free website ranking checker' },
  { keyword: 'free website seo evaluation tool' },
  { keyword: 'free website seo review' },
  { keyword: 'generate meta description' },
  { keyword: 'generate seo' },
  { keyword: 'generate seo description' },
  { keyword: 'generate seo report' },
  { keyword: 'get better seo' },
  { keyword: 'get higher on google search results' },
  { keyword: 'get more visitors to your website' },
  { keyword: 'get seo' },
  { keyword: 'get seo for my website' },
  { keyword: 'get website higher on google' },
  { keyword: 'google add page' },
  { keyword: 'google add site' },
  { keyword: 'google add website' },
  { keyword: 'google ads keyword research tool' },
  { keyword: 'google ads preview tool' },
  { keyword: 'google ai seo' },
  { keyword: 'google also search for' },
  { keyword: 'google and search' },
  { keyword: 'google api for search results' },
  { keyword: 'google api for seo' },
  { keyword: 'google business search engine optimization' },
  { keyword: 'google check site seo' },
  { keyword: 'google check website seo' },
  { keyword: 'google chrome seo plugin' },
  { keyword: 'google core web vitals' },
  { keyword: 'google core web vitals check' },
  { keyword: 'google core web vitals test' },
  { keyword: 'google core web vitals tool' },
  { keyword: 'google description' },
  { keyword: 'google display' },
  { keyword: 'google docs seo' },
  { keyword: 'google extension seo' },
  { keyword: 'google featured snippets' },
  { keyword: 'google first page' },
  { keyword: 'google indexing tools' },
  { keyword: 'google ka link' },
  { keyword: 'google keyword analysis tool' },
  { keyword: 'google keyword api' },
  { keyword: 'google keyword free tool' },
  { keyword: 'google keyword optimization tool' },
  { keyword: 'google keyword research api' },
  { keyword: 'google keyword search tool' },
  { keyword: 'google keyword seo tool' },
  { keyword: 'google keyword tool api' },
  { keyword: 'google keyword tracker' },
  { keyword: 'google keyword tracker tool' },
  { keyword: 'google keyword website' },
  { keyword: 'google keywords checker' },
  { keyword: 'google keywords tool' },
  { keyword: 'google latest seo updates' },
  { keyword: 'google latest update' },
  { keyword: 'google listing seo' },
  { keyword: 'google meta' },
  { keyword: 'google meta check' },
  { keyword: 'google meta data' },
  { keyword: 'google meta description' },
  { keyword: 'google meta description checker' },
  { keyword: 'google meta description preview' },
  { keyword: 'google meta keywords' },
  { keyword: 'google meta tags' },
  { keyword: 'google meta tags checker' },
  { keyword: 'google meta tags generator' },
  { keyword: 'google mobile serp' },
  { keyword: 'google my business seo tools' },
  { keyword: 'google name tag' },
  { keyword: 'google new seo' },
  { keyword: 'google new tools' },
  { keyword: 'google new update for seo' },
  { keyword: 'google optimisation' },
  { keyword: 'google optimization tools' },
  { keyword: 'google page 1' },
  { keyword: 'google page optimization' },
  { keyword: 'google page ranking checker' },
  { keyword: 'google page seo' },
  { keyword: 'google page seo test' },
  { keyword: 'google page tools' },
  { keyword: 'google paid seo' },
  { keyword: 'google position check' },
  { keyword: 'google preview tool' },
  { keyword: 'google product rating' },
  { keyword: 'google rank' },
  { keyword: 'google rank api' },
  { keyword: 'google rank check' },
  { keyword: 'google rank checker api' },
  { keyword: 'google rank checker tool' },
  { keyword: 'google rank my website' },
  { keyword: 'google rank search' },
  { keyword: 'google rank tool' },
  { keyword: 'google rank website' },
  { keyword: 'google rank website check' },
  { keyword: 'google ranking check' },
  { keyword: 'google ranking service' },
  { keyword: 'google ranking test' },
  { keyword: 'google ranking tools' },
  { keyword: 'google rating' },
  { keyword: 'google rating check' },
  { keyword: 'google rating for website' },
  { keyword: 'google rating on website' },
  { keyword: 'google rating search' },
  { keyword: 'google research tool' },
  { keyword: 'google research tool keyword' },
  { keyword: 'google review' },
  { keyword: 'google review checker' },
  { keyword: 'google review extension' },
  { keyword: 'google review how to' },
  { keyword: 'google review page' },
  { keyword: 'google review review' },
  { keyword: 'google review seo' },
  { keyword: 'google review sign up' },
  { keyword: 'google review site' },
  { keyword: 'google review snippet' },
  { keyword: 'google review software' },
  { keyword: 'google review tool' },
  { keyword: 'google review website' },
  { keyword: 'google reviews search' },
  { keyword: 'google rich snippets' },
  { keyword: 'google schema' },
  { keyword: 'google schema checker' },
  { keyword: 'google schema markup' },
  { keyword: 'google schema tester' },
  { keyword: 'google schema testing tool' },
  { keyword: 'google score' },
  { keyword: 'google score checker' },
  { keyword: 'google search ads preview tool' },
  { keyword: 'google search ai' },
  { keyword: 'google search engine ai' },
  { keyword: 'google search engine for website' },
  { keyword: 'google search engine keywords' },
  { keyword: 'google search engine marketing' },
  { keyword: 'google search engine optimization' },
  { keyword: 'google search engine optimization for my website' },
  { keyword: 'google search engine optimization keywords' },
  { keyword: 'google search engine optimization tools' },
  { keyword: 'google search engine optimization tools free' },
  { keyword: 'google search engine seo' },
  { keyword: 'google search engine tools' },
  { keyword: 'google search engines' },
  { keyword: 'google search first page' },
  { keyword: 'google search google' },
  { keyword: 'google search optimisation' },
  { keyword: 'google search optimization' },
  { keyword: 'google search optimization for website' },
  { keyword: 'google search optimization tool' },
  { keyword: 'google search preview tool' },
  { keyword: 'google search rank checker' },
  { keyword: 'google search ranking check' },
  { keyword: 'google search ranking tool' },
  { keyword: 'google search rating' },
  { keyword: 'google search research tool' },
  { keyword: 'google search results api' },
  { keyword: 'google search results for my website' },
  { keyword: 'google search results page' },
  { keyword: 'google search results preview test' },
  { keyword: 'google search results tool' },
  { keyword: 'google search seo' },
  { keyword: 'google search seo check' },
  { keyword: 'google search seo tools' },
  { keyword: 'google search serp' },
  { keyword: 'google search snippet' },
  { keyword: 'google search snippet tool' },
  { keyword: 'google search traffic tool' },
  { keyword: 'google search web' },
  { keyword: 'google search website' },
  { keyword: 'google seo' },
  { keyword: 'google seo account' },
  { keyword: 'google seo ai' },
  { keyword: 'google seo analysis' },
  { keyword: 'google seo analysis tool' },
  { keyword: 'google seo analyzer' },
  { keyword: 'google seo api' },
  { keyword: 'google seo booster' },
  { keyword: 'google seo check website' },
  { keyword: 'google seo checker' },
  { keyword: 'google seo checker free' },
  { keyword: 'google seo checker online' },
  { keyword: 'google seo checker tool' },
  { keyword: 'google seo description' },
  { keyword: 'google seo documentation' },
  { keyword: 'google seo example' },
  { keyword: 'google seo extension' },
  { keyword: 'google seo for my website' },
  { keyword: 'google seo free' },
  { keyword: 'google seo free tools' },
  { keyword: 'google seo guide' },
  { keyword: 'google seo help' },
  { keyword: 'google seo information' },
  { keyword: 'google seo keyword analysis' },
  { keyword: 'google seo keyword research' },
  { keyword: 'google seo keyword research tool' },
  { keyword: 'google seo keyword search tool' },
  { keyword: 'google seo keywords' },
  { keyword: 'google seo latest update' },
  { keyword: 'google seo link' },
  { keyword: 'google seo management' },
  { keyword: 'google seo marketing' },
  { keyword: 'google seo meta description' },
  { keyword: 'google seo meta tags' },
  { keyword: 'google seo news' },
  { keyword: 'google seo online' },
  { keyword: 'google seo optimisation' },
  { keyword: 'google seo optimization' },
  { keyword: 'google seo optimization tool' },
  { keyword: 'google seo page checker' },
  { keyword: 'google seo plugin' },
  { keyword: 'google seo preview' },
  { keyword: 'google seo rank' },
  { keyword: 'google seo ranking checker' },
  { keyword: 'google seo rating' },
  { keyword: 'google seo report' },
  { keyword: 'google seo score' },
  { keyword: 'google seo score checker' },
  { keyword: 'google seo search' },
  { keyword: 'google seo search engine optimization' },
  { keyword: 'google seo search tool' },
  { keyword: 'google seo services' },
  { keyword: 'google seo simulator' },
  { keyword: 'google seo site' },
  { keyword: 'google seo site checker' },
  { keyword: 'google seo software' },
  { keyword: 'google seo starter' },
  { keyword: 'google seo structured data' },
  { keyword: 'google seo tags' },
  { keyword: 'google seo test' },
  { keyword: 'google seo test tool' },
  { keyword: 'google seo tools' },
  { keyword: 'google seo tools free' },
  { keyword: 'google seo tools keyword' },
  { keyword: 'google seo traffic' },
  { keyword: 'google seo update' },
  { keyword: 'google seo website' },
  { keyword: 'google seo website checker' },
  { keyword: 'google serp' },
  { keyword: 'google serp analysis' },
  { keyword: 'google serp api' },
  { keyword: 'google serp checker' },
  { keyword: 'google serp checker tool' },
  { keyword: 'google serp data' },
  { keyword: 'google serp features' },
  { keyword: 'google serp generator' },
  { keyword: 'google serp layout' },
  { keyword: 'google serp meaning' },
  { keyword: 'google serp optimization tool' },
  { keyword: 'google serp preview' },
  { keyword: 'google serp preview tool' },
  { keyword: 'google serp rank checker' },
  { keyword: 'google serp results' },
  { keyword: 'google serp simulator' },
  { keyword: 'google serp snippet' },
  { keyword: 'google serp snippet optimization' },
  { keyword: 'google serp snippet optimization tool' },
  { keyword: 'google serp snippet preview' },
  { keyword: 'google serp snippet preview tool' },
  { keyword: 'google serp snippet tool' },
  { keyword: 'google serp test' },
  { keyword: 'google serp tester' },
  { keyword: 'google serp tool' },
  { keyword: 'google serp updates' },
  { keyword: 'google site checker seo' },
  { keyword: 'google site optimization' },
  { keyword: 'google site rank checker' },
  { keyword: 'google site ranking checker' },
  { keyword: 'google site seo' },
  { keyword: 'google site seo check' },
  { keyword: 'google site seo test' },
  { keyword: 'google site tools' },
  { keyword: 'google site traffic checker' },
  { keyword: 'google sites seo' },
  { keyword: 'google snippet checker' },
  { keyword: 'google snippet generator' },
  { keyword: 'google snippet optimization tool' },
  { keyword: 'google snippet optimizer' },
  { keyword: 'google snippet preview' },
  { keyword: 'google snippet preview tool' },
  { keyword: 'google snippet tool' },
  { keyword: 'google snippets' },
  { keyword: 'google structured data' },
  { keyword: 'google structured data testing tool' },
  { keyword: 'google structured data tool' },
  { keyword: 'google technical seo' },
  { keyword: 'google title tag' },
  { keyword: 'google tools for seo' },
  { keyword: 'google tools for website analysis' },
  { keyword: 'google tools for websites' },
  { keyword: 'google tools free' },
  { keyword: 'google traffic checker' },
  { keyword: 'google updates' },
  { keyword: 'google url checker' },
  { keyword: 'google visibility score' },
  { keyword: 'google web core vitals test' },
  { keyword: 'google web optimization' },
  { keyword: 'google web page optimization' },
  { keyword: 'google web seo' },
  { keyword: 'google web vitals' },
  { keyword: 'google web vitals test' },
  { keyword: 'google webmaster tool' },
  { keyword: 'google webmaster tools api' },
  { keyword: 'google website check seo' },
  { keyword: 'google website optimization tools' },
  { keyword: 'google website rank checker' },
  { keyword: 'google website rank checker free' },
  { keyword: 'google website ranking' },
  { keyword: 'google website rating' },
  { keyword: 'google website rating check' },
  { keyword: 'google website score checker' },
  { keyword: 'google website search' },
  { keyword: 'google website search optimization' },
  { keyword: 'google website seo' },
  { keyword: 'google website seo checker' },
  { keyword: 'google website seo test' },
  { keyword: 'google website test seo' },
  { keyword: 'google website tools' },
  { keyword: 'google what is a url' },
  { keyword: 'google with seo' },
  { keyword: 'google\'s seo starter guide' },
  { keyword: 'help with seo for website' },
  { keyword: 'higher seo' },
  { keyword: 'higher visibility seo' },
  { keyword: 'higher visibility serp' },
  { keyword: 'highervisibility serp' },
  { keyword: 'homepage meta description generator' },
  { keyword: 'i need seo for my website' },
  { keyword: 'image seo' },
  { keyword: 'image seo tool' },
  { keyword: 'improve google' },
  { keyword: 'improve google ranking' },
  { keyword: 'improve google ranking free' },
  { keyword: 'improve google search' },
  { keyword: 'improve google search results' },
  { keyword: 'improve google search results for my website' },
  { keyword: 'improve google seo ranking' },
  { keyword: 'improve my google search results' },
  { keyword: 'improve my seo' },
  { keyword: 'improve my website ranking on google' },
  { keyword: 'improve my website seo' },
  { keyword: 'improve search engine optimization' },
  { keyword: 'improve seo' },
  { keyword: 'improve seo free' },
  { keyword: 'improve seo on google' },
  { keyword: 'improve seo ranking' },
  { keyword: 'improve seo ranking on google' },
  { keyword: 'improve site seo' },
  { keyword: 'improve website ranking' },
  { keyword: 'improve website search ranking' },
  { keyword: 'improve website seo' },
  { keyword: 'improve website visibility on google' },
  { keyword: 'improve your google search ranking' },
  { keyword: 'improve your seo' },
  { keyword: 'improve your website seo' },
  { keyword: 'increase google search visibility' },
  { keyword: 'increase google seo' },
  { keyword: 'increase google visibility' },
  { keyword: 'increase my seo' },
  { keyword: 'increase search engine optimization' },
  { keyword: 'increase seo' },
  { keyword: 'increase seo for website' },
  { keyword: 'increase seo on google' },
  { keyword: 'increase seo ranking' },
  { keyword: 'increase website ranking' },
  { keyword: 'increase website seo' },
  { keyword: 'increase website visibility' },
  { keyword: 'increase your seo' },
  { keyword: 'information about search engine optimization' },
  { keyword: 'kw research tool' },
  { keyword: 'latest search engine' },
  { keyword: 'latest seo' },
  { keyword: 'latest seo tools' },
  { keyword: 'latest update on seo' },
  { keyword: 'link check website' },
  { keyword: 'link checking tool' },
  { keyword: 'link finder tool' },
  { keyword: 'link google review' },
  { keyword: 'listing seo' },
  { keyword: 'local search results tool' },
  { keyword: 'local seo tools' },
  { keyword: 'local serp' },
  { keyword: 'local serp checker' },
  { keyword: 'look at website traffic' },
  { keyword: 'looking for seo' },
  { keyword: 'make a google review' },
  { keyword: 'make seo' },
  { keyword: 'make seo for website' },
  { keyword: 'make your website appear first google' },
  { keyword: 'make your website appear on google' },
  { keyword: 'make your website searchable on google' },
  { keyword: 'make your website show up on google' },
  { keyword: 'manage seo' },
  { keyword: 'mangools blog' },
  { keyword: 'mangools keyword' },
  { keyword: 'mangools seo' },
  { keyword: 'mangools seo extension' },
  { keyword: 'mangools seo tools' },
  { keyword: 'mangools serp' },
  { keyword: 'mangools serp checker' },
  { keyword: 'mangools serp simulator' },
  { keyword: 'mangools tools' },
  { keyword: 'maximize seo' },
  { keyword: 'meta description' },
  { keyword: 'meta description ai' },
  { keyword: 'meta description analyzer' },
  { keyword: 'meta description and title checker' },
  { keyword: 'meta description checker' },
  { keyword: 'meta description checker free' },
  { keyword: 'meta description example' },
  { keyword: 'meta description for blog' },
  { keyword: 'meta description for contact us page' },
  { keyword: 'meta description for website' },
  { keyword: 'meta description generator' },
  { keyword: 'meta description generator ai' },
  { keyword: 'meta description generator from url' },
  { keyword: 'meta description html' },
  { keyword: 'meta description length' },
  { keyword: 'meta description length checker' },
  { keyword: 'meta description on website' },
  { keyword: 'meta description optimization' },
  { keyword: 'meta description page' },
  { keyword: 'meta description preview' },
  { keyword: 'meta description preview tool' },
  { keyword: 'meta description tag' },
  { keyword: 'meta description tag in seo' },
  { keyword: 'meta description testing tool' },
  { keyword: 'meta description tool' },
  { keyword: 'meta description writing tool' },
  { keyword: 'meta keywords seo' },
  { keyword: 'meta preview' },
  { keyword: 'meta preview tool' },
  { keyword: 'meta tag checker' },
  { keyword: 'meta tag description example' },
  { keyword: 'meta tag optimization' },
  { keyword: 'meta tags' },
  { keyword: 'meta tags for search engine optimization' },
  { keyword: 'meta tags for seo' },
  { keyword: 'meta tags google search engine optimization' },
  { keyword: 'meta tags preview' },
  { keyword: 'meta tags tool' },
  { keyword: 'meta title' },
  { keyword: 'meta title and description' },
  { keyword: 'meta title and description tool' },
  { keyword: 'meta title and meta description' },
  { keyword: 'meta title checker' },
  { keyword: 'meta title preview' },
  { keyword: 'meta title preview tool' },
  { keyword: 'meta title tag' },
  { keyword: 'mobile seo tools' },
  { keyword: 'more search engines' },
  { keyword: 'most important seo tools' },
  { keyword: 'most popular seo tools' },
  { keyword: 'most used seo tools' },
  { keyword: 'my seo' },
  { keyword: 'my seo tool' },
  { keyword: 'my serp checker' },
  { keyword: 'my website google ranking' },
  { keyword: 'my website score' },
  { keyword: 'need seo for my website' },
  { keyword: 'new search' },
  { keyword: 'new search engines' },
  { keyword: 'new seo' },
  { keyword: 'off page seo tools' },
  { keyword: 'on page optimization checker' },
  { keyword: 'on page score checker' },
  { keyword: 'on page search engine optimization' },
  { keyword: 'on page seo checker free tool' },
  { keyword: 'on page seo checker tool' },
  { keyword: 'on page seo free tools' },
  { keyword: 'on page seo keyword research' },
  { keyword: 'on page seo optimization' },
  { keyword: 'on page seo review' },
  { keyword: 'on page seo software' },
  { keyword: 'on page seo tools' },
  { keyword: 'on page seo tools free' },
  { keyword: 'on page tool' },
  { keyword: 'on site seo' },
  { keyword: 'online free seo checker' },
  { keyword: 'online search engine optimization' },
  { keyword: 'online search tools' },
  { keyword: 'online seo tools' },
  { keyword: 'optimal seo' },
  { keyword: 'optimise website for seo' },
  { keyword: 'optimiser seo' },
  { keyword: 'optimization checker' },
  { keyword: 'optimization tools' },
  { keyword: 'optimize google' },
  { keyword: 'optimize my website for google' },
  { keyword: 'optimize seo for my website' },
  { keyword: 'optimize website for google search' },
  { keyword: 'optimize your' },
  { keyword: 'optimize your seo' },
  { keyword: 'optimize your site for seo' },
  { keyword: 'optimize your website' },
  { keyword: 'optimize your website for search engines' },
  { keyword: 'optimize your website for seo' },
  { keyword: 'overview google' },
  { keyword: 'page analysis tool' },
  { keyword: 'page authority and domain authority checker' },
  { keyword: 'page meta description' },
  { keyword: 'page rank checker free' },
  { keyword: 'page ranking check' },
  { keyword: 'page ranking tool' },
  { keyword: 'page rating' },
  { keyword: 'page score checker' },
  { keyword: 'page seo analyzer' },
  { keyword: 'page seo score' },
  { keyword: 'page seo score checker' },
  { keyword: 'page title and meta description checker' },
  { keyword: 'page traffic' },
  { keyword: 'page traffic seo' },
  { keyword: 'paid google search engine optimization' },
  { keyword: 'paid seo google' },
  { keyword: 'pay for search engine optimization' },
  { keyword: 'people also ask seo' },
  { keyword: 'people also ask tool' },
  { keyword: 'people also search for google' },
  { keyword: 'plugin chrome seo' },
  { keyword: 'popular seo tools' },
  { keyword: 'portent serp preview tool' },
  { keyword: 'preview google search result' },
  { keyword: 'preview meta tags' },
  { keyword: 'preview tool' },
  { keyword: 'preview tool google ads' },
  { keyword: 'product meta description example' },
  { keyword: 'rank checker seo tool' },
  { keyword: 'rank checker tools' },
  { keyword: 'rank checker website' },
  { keyword: 'rank higher in google search' },
  { keyword: 'rank higher on google search' },
  { keyword: 'rank my seo' },
  { keyword: 'rank my website seo' },
  { keyword: 'rank on first page of google' },
  { keyword: 'rank on google first page' },
  { keyword: 'rank search' },
  { keyword: 'rank search engines' },
  { keyword: 'rank tool' },
  { keyword: 'rank tracker seo tool' },
  { keyword: 'rank website on google' },
  { keyword: 'rank website traffic' },
  { keyword: 'rank your website' },
  { keyword: 'ranking check' },
  { keyword: 'ranking google check' },
  { keyword: 'ranking my website' },
  { keyword: 'rate your website' },
  { keyword: 'rating on google' },
  { keyword: 'rating seo' },
  { keyword: 'relevant keywords' },
  { keyword: 'reputation tools' },
  { keyword: 'research tool' },
  { keyword: 'review google link' },
  { keyword: 'review google review' },
  { keyword: 'review link google' },
  { keyword: 'review schema generator' },
  { keyword: 'review snippet' },
  { keyword: 'review your website' },
  { keyword: 'rich snippets' },
  { keyword: 'rich snippets seo' },
  { keyword: 'scan seo' },
  { keyword: 'score checker' },
  { keyword: 'search and seo' },
  { keyword: 'search description' },
  { keyword: 'search engine' },
  { keyword: 'search engine analysis' },
  { keyword: 'search engine google' },
  { keyword: 'search engine keywords' },
  { keyword: 'search engine marketing' },
  { keyword: 'search engine marketing tools' },
  { keyword: 'search engine o' },
  { keyword: 'search engine on google' },
  { keyword: 'search engine optimisation google' },
  { keyword: 'search engine optimisation seo' },
  { keyword: 'search engine optimisation service' },
  { keyword: 'search engine optimisation tool' },
  { keyword: 'search engine optimization' },
  { keyword: 'search engine optimization ai' },
  { keyword: 'search engine optimization analysis' },
  { keyword: 'search engine optimization and digital marketing' },
  { keyword: 'search engine optimization checker' },
  { keyword: 'search engine optimization content writing' },
  { keyword: 'search engine optimization examples' },
  { keyword: 'search engine optimization for beginners' },
  { keyword: 'search engine optimization for business' },
  { keyword: 'search engine optimization for my website' },
  { keyword: 'search engine optimization for website traffic' },
  { keyword: 'search engine optimization free tools' },
  { keyword: 'search engine optimization how to' },
  { keyword: 'search engine optimization how to do' },
  { keyword: 'search engine optimization is' },
  { keyword: 'search engine optimization keyword research' },
  { keyword: 'search engine optimization news' },
  { keyword: 'search engine optimization process' },
  { keyword: 'search engine optimization report' },
  { keyword: 'search engine optimization research' },
  { keyword: 'search engine optimization site' },
  { keyword: 'search engine optimization sites' },
  { keyword: 'search engine optimization software' },
  { keyword: 'search engine optimization test' },
  { keyword: 'search engine optimization tools' },
  { keyword: 'search engine optimization tools free' },
  { keyword: 'search engine optimization website' },
  { keyword: 'search engine optimization what is it' },
  { keyword: 'search engine page' },
  { keyword: 'search engine preview' },
  { keyword: 'search engine results page' },
  { keyword: 'search engine results page serp' },
  { keyword: 'search engine simulator' },
  { keyword: 'search engine site' },
  { keyword: 'search engine tools' },
  { keyword: 'search engine traffic' },
  { keyword: 'search engine website' },
  { keyword: 'search engines that use google' },
  { keyword: 'search for a site' },
  { keyword: 'search for seo' },
  { keyword: 'search for tools' },
  { keyword: 'search google seo' },
  { keyword: 'search google tools' },
  { keyword: 'search optimisation' },
  { keyword: 'search optimization' },
  { keyword: 'search optimization tools' },
  { keyword: 'search pages' },
  { keyword: 'search query' },
  { keyword: 'search result optimization' },
  { keyword: 'search results' },
  { keyword: 'search search engine' },
  { keyword: 'search site traffic' },
  { keyword: 'search snippet generator' },
  { keyword: 'search snippet tool' },
  { keyword: 'search snippets' },
  { keyword: 'search tool' },
  { keyword: 'search traffic google' },
  { keyword: 'search traffic of a website' },
  { keyword: 'search web' },
  { keyword: 'search web sites' },
  { keyword: 'search website google' },
  { keyword: 'search website traffic' },
  { keyword: 'search with google' },
  { keyword: 'search your website' },
  { keyword: 'see seo ranking' },
  { keyword: 'seo add' },
  { keyword: 'seo agency tool' },
  { keyword: 'seo agent' },
  { keyword: 'seo ai' },
  { keyword: 'seo ai content' },
  { keyword: 'seo ai tools' },
  { keyword: 'seo ai tools free' },
  { keyword: 'seo all tools' },
  { keyword: 'seo analysis' },
  { keyword: 'seo analysis api' },
  { keyword: 'seo analysis checker' },
  { keyword: 'seo analysis of page' },
  { keyword: 'seo analysis software' },
  { keyword: 'seo analysis tool google' },
  { keyword: 'seo analysis tools' },
  { keyword: 'seo analytics website' },
  { keyword: 'seo analyzer' },
  { keyword: 'seo analyzer api' },
  { keyword: 'seo analyzer free' },
  { keyword: 'seo analyzer page' },
  { keyword: 'seo analyzer site' },
  { keyword: 'seo analyzer tool' },
  { keyword: 'seo and ai' },
  { keyword: 'seo and content' },
  { keyword: 'seo and google' },
  { keyword: 'seo and optimization' },
  { keyword: 'seo and search engine marketing' },
  { keyword: 'seo and seo' },
  { keyword: 'seo and website management' },
  { keyword: 'seo and website optimization' },
  { keyword: 'seo api' },
  { keyword: 'seo api google' },
  { keyword: 'seo api tool' },
  { keyword: 'seo applications' },
  { keyword: 'seo apps' },
  { keyword: 'seo assessment tool' },
  { keyword: 'seo authority' },
  { keyword: 'seo blog checker' },
  { keyword: 'seo booster free' },
  { keyword: 'seo bulk tools' },
  { keyword: 'seo business' },
  { keyword: 'seo chatbot' },
  { keyword: 'seo check extension' },
  { keyword: 'seo check in' },
  { keyword: 'seo check my website' },
  { keyword: 'seo check tool' },
  { keyword: 'seo check website google' },
  { keyword: 'seo checker' },
  { keyword: 'seo checker api' },
  { keyword: 'seo checker chrome extension' },
  { keyword: 'seo checker for content' },
  { keyword: 'seo checker free tools' },
  { keyword: 'seo checker google' },
  { keyword: 'seo checker website free' },
  { keyword: 'seo chrome' },
  { keyword: 'seo chrome extension' },
  { keyword: 'seo chrome extension free' },
  { keyword: 'seo chrome plugin' },
  { keyword: 'seo click' },
  { keyword: 'seo code' },
  { keyword: 'seo comparison tools' },
  { keyword: 'seo conference' },
  { keyword: 'seo content' },
  { keyword: 'seo content ai' },
  { keyword: 'seo content analysis api' },
  { keyword: 'seo content analysis tool' },
  { keyword: 'seo content analysis tool free' },
  { keyword: 'seo content checker' },
  { keyword: 'seo content checker free' },
  { keyword: 'seo content checker tool' },
  { keyword: 'seo content editor' },
  { keyword: 'seo content for website' },
  { keyword: 'seo content optimization tools' },
  { keyword: 'seo content optimizer' },
  { keyword: 'seo content review' },
  { keyword: 'seo content score checker' },
  { keyword: 'seo content tools' },
  { keyword: 'seo content website' },
  { keyword: 'seo content writing ai' },
  { keyword: 'seo content writing tools' },
  { keyword: 'seo dashboards' },
  { keyword: 'seo data' },
  { keyword: 'seo description' },
  { keyword: 'seo description checker' },
  { keyword: 'seo description example' },
  { keyword: 'seo description generator' },
  { keyword: 'seo description length checker' },
  { keyword: 'seo description tag' },
  { keyword: 'seo description tool' },
  { keyword: 'seo details' },
  { keyword: 'seo detector' },
  { keyword: 'seo diagnostic tool' },
  { keyword: 'seo editor' },
  { keyword: 'seo elements' },
  { keyword: 'seo engine' },
  { keyword: 'seo engines' },
  { keyword: 'seo evaluation' },
  { keyword: 'seo evaluation of website' },
  { keyword: 'seo evaluation online free' },
  { keyword: 'seo evaluation tool' },
  { keyword: 'seo evaluation tool free' },
  { keyword: 'seo events' },
  { keyword: 'seo examples' },
  { keyword: 'seo extension' },
  { keyword: 'seo extension google' },
  { keyword: 'seo extension google chrome' },
  { keyword: 'seo extension tool' },
  { keyword: 'seo faq' },
  { keyword: 'seo features' },
  { keyword: 'seo feedback' },
  { keyword: 'seo first page' },
  { keyword: 'seo for html website' },
  { keyword: 'seo for my website' },
  { keyword: 'seo for new website' },
  { keyword: 'seo for web pages' },
  { keyword: 'seo for website free' },
  { keyword: 'seo free' },
  { keyword: 'seo free tools for google rankings' },
  { keyword: 'seo generator for website' },
  { keyword: 'seo generator tool' },
  { keyword: 'seo google' },
  { keyword: 'seo google chrome extension' },
  { keyword: 'seo google page rank checker' },
  { keyword: 'seo google ranking' },
  { keyword: 'seo google results' },
  { keyword: 'seo google score' },
  { keyword: 'seo google search engine' },
  { keyword: 'seo google website' },
  { keyword: 'seo help' },
  { keyword: 'seo help for my website' },
  { keyword: 'seo help for website' },
  { keyword: 'seo helper' },
  { keyword: 'seo homepage' },
  { keyword: 'seo how to rank higher on google' },
  { keyword: 'seo how to work' },
  { keyword: 'seo html' },
  { keyword: 'seo https' },
  { keyword: 'seo improvement tools' },
  { keyword: 'seo in a website' },
  { keyword: 'seo in advertising' },
  { keyword: 'seo info' },
  { keyword: 'seo information' },
  { keyword: 'seo keyword analysis free' },
  { keyword: 'seo keyword analysis tools' },
  { keyword: 'seo keyword api' },
  { keyword: 'seo keyword free tool' },
  { keyword: 'seo keyword research' },
  { keyword: 'seo keyword research tool' },
  { keyword: 'seo keyword search tool' },
  { keyword: 'seo keywords' },
  { keyword: 'seo keywords checker' },
  { keyword: 'seo keywords tool' },
  { keyword: 'seo know how' },
  { keyword: 'seo link' },
  { keyword: 'seo link check' },
  { keyword: 'seo listing' },
  { keyword: 'seo look up' },
  { keyword: 'seo lookup' },
  { keyword: 'seo lookup tool' },
  { keyword: 'seo management' },
  { keyword: 'seo management tools' },
  { keyword: 'seo mangools' },
  { keyword: 'seo maps' },
  { keyword: 'seo marketing free' },
  { keyword: 'seo marketing website' },
  { keyword: 'seo meta' },
  { keyword: 'seo meta checker' },
  { keyword: 'seo meta description' },
  { keyword: 'seo meta description checker' },
  { keyword: 'seo meta description generator' },
  { keyword: 'seo meta description length' },
  { keyword: 'seo meta description tool' },
  { keyword: 'seo meta tags generator' },
  { keyword: 'seo meta tester' },
  { keyword: 'seo meta title' },
  { keyword: 'seo meta title and description' },
  { keyword: 'seo meta tool' },
  { keyword: 'seo metadata' },
  { keyword: 'seo metadata checker' },
  { keyword: 'seo mobile' },
  { keyword: 'seo mofo' },
  { keyword: 'seo my business' },
  { keyword: 'seo my site' },
  { keyword: 'seo new tools' },
  { keyword: 'seo news' },
  { keyword: 'seo of the website' },
  { keyword: 'seo on page' },
  { keyword: 'seo on page checker tool' },
  { keyword: 'seo on page off page' },
  { keyword: 'seo on page optimization' },
  { keyword: 'seo online' },
  { keyword: 'seo online check' },
  { keyword: 'seo online tools' },
  { keyword: 'seo opportunities' },
  { keyword: 'seo optimisation' },
  { keyword: 'seo optimisation for website' },
  { keyword: 'seo optimisation google' },
  { keyword: 'seo optimisation services' },
  { keyword: 'seo optimisation tools' },
  { keyword: 'seo optimised' },
  { keyword: 'seo optimiser' },
  { keyword: 'seo optimization' },
  { keyword: 'seo optimization ai' },
  { keyword: 'seo optimization checker' },
  { keyword: 'seo optimization checker free' },
  { keyword: 'seo optimization free' },
  { keyword: 'seo optimization how to' },
  { keyword: 'seo optimization online' },
  { keyword: 'seo optimization score' },
  { keyword: 'seo optimization site' },
  { keyword: 'seo optimization software' },
  { keyword: 'seo optimization test' },
  { keyword: 'seo optimization tool' },
  { keyword: 'seo optimization tools' },
  { keyword: 'seo optimization website analysis' },
  { keyword: 'seo optimize' },
  { keyword: 'seo optimized content' },
  { keyword: 'seo optimized content checker' },
  { keyword: 'seo optimizer checker' },
  { keyword: 'seo organic search' },
  { keyword: 'seo overview' },
  { keyword: 'seo overview tool' },
  { keyword: 'seo page' },
  { keyword: 'seo page analysis tool' },
  { keyword: 'seo page checker' },
  { keyword: 'seo page checker free' },
  { keyword: 'seo page description' },
  { keyword: 'seo page rank checker' },
  { keyword: 'seo page ranking check' },
  { keyword: 'seo page review' },
  { keyword: 'seo page score checker' },
  { keyword: 'seo page title' },
  { keyword: 'seo page title checker' },
  { keyword: 'seo platforms' },
  { keyword: 'seo positioning' },
  { keyword: 'seo preview' },
  { keyword: 'seo preview font' },
  { keyword: 'seo preview tool' },
  { keyword: 'seo product' },
  { keyword: 'seo programme' },
  { keyword: 'seo proof' },
  { keyword: 'seo quick tool' },
  { keyword: 'seo rank' },
  { keyword: 'seo rank analyzer' },
  { keyword: 'seo rank check' },
  { keyword: 'seo rank checker free' },
  { keyword: 'seo rank checker tools' },
  { keyword: 'seo rank my site' },
  { keyword: 'seo ranking' },
  { keyword: 'seo ranking analyzer' },
  { keyword: 'seo ranking checker' },
  { keyword: 'seo ranking checker google' },
  { keyword: 'seo ranking of my website' },
  { keyword: 'seo ranking search' },
  { keyword: 'seo ranking tools' },
  { keyword: 'seo rating' },
  { keyword: 'seo rating checker' },
  { keyword: 'seo rating for website' },
  { keyword: 'seo rating free' },
  { keyword: 'seo rating google' },
  { keyword: 'seo rating test' },
  { keyword: 'seo rating tool' },
  { keyword: 'seo recommendation' },
  { keyword: 'seo report' },
  { keyword: 'seo report api' },
  { keyword: 'seo report check' },
  { keyword: 'seo report for my website' },
  { keyword: 'seo report generator tool' },
  { keyword: 'seo report of a website' },
  { keyword: 'seo report tool' },
  { keyword: 'seo reporting dashboard' },
  { keyword: 'seo reputation' },
  { keyword: 'seo research' },
  { keyword: 'seo research tool' },
  { keyword: 'seo results' },
  { keyword: 'seo review' },
  { keyword: 'seo review tools' },
  { keyword: 'seo review tools backlink checker' },
  { keyword: 'seo review tools content analysis' },
  { keyword: 'seo review tools for chrome' },
  { keyword: 'seo review tools website traffic checker' },
  { keyword: 'seo scan tool' },
  { keyword: 'seo scanner website' },
  { keyword: 'seo score' },
  { keyword: 'seo score analyzer' },
  { keyword: 'seo score api' },
  { keyword: 'seo score checker' },
  { keyword: 'seo score checker free' },
  { keyword: 'seo score checker google' },
  { keyword: 'seo score checker tool' },
  { keyword: 'seo score of a website' },
  { keyword: 'seo score tool' },
  { keyword: 'seo score website' },
  { keyword: 'seo search' },
  { keyword: 'seo search engine' },
  { keyword: 'seo search engine optimization' },
  { keyword: 'seo search engine optimization google' },
  { keyword: 'seo search engine optimization tools' },
  { keyword: 'seo search optimization' },
  { keyword: 'seo search simulator' },
  { keyword: 'seo search tools' },
  { keyword: 'seo search tools free' },
  { keyword: 'seo search traffic' },
  { keyword: 'seo search website' },
  { keyword: 'seo seminars' },
  { keyword: 'seo seo tools' },
  { keyword: 'seo serp checker' },
  { keyword: 'seo service website' },
  { keyword: 'seo services free' },
  { keyword: 'seo sign up' },
  { keyword: 'seo simulator' },
  { keyword: 'seo site' },
  { keyword: 'seo site analysis tools' },
  { keyword: 'seo site checker tool' },
  { keyword: 'seo site checkup google' },
  { keyword: 'seo site description' },
  { keyword: 'seo site google' },
  { keyword: 'seo site optimization' },
  { keyword: 'seo site ranking' },
  { keyword: 'seo site review' },
  { keyword: 'seo site tools' },
  { keyword: 'seo snippet checker' },
  { keyword: 'seo snippet generator' },
  { keyword: 'seo snippet optimizer' },
  { keyword: 'seo snippet preview' },
  { keyword: 'seo snippet tool' },
  { keyword: 'seo software' },
  { keyword: 'seo software tool' },
  { keyword: 'seo softwares' },
  { keyword: 'seo spec' },
  { keyword: 'seo suggestions' },
  { keyword: 'seo suggestions for website' },
  { keyword: 'seo tag checker' },
  { keyword: 'seo tags' },
  { keyword: 'seo tags for website' },
  { keyword: 'seo technical tools' },
  { keyword: 'seo test' },
  { keyword: 'seo test google' },
  { keyword: 'seo test my site' },
  { keyword: 'seo test of website' },
  { keyword: 'seo test url' },
  { keyword: 'seo test website' },
  { keyword: 'seo test website google' },
  { keyword: 'seo tester' },
  { keyword: 'seo testimonials' },
  { keyword: 'seo testing tools' },
  { keyword: 'seo testing tools free' },
  { keyword: 'seo text' },
  { keyword: 'seo text ai' },
  { keyword: 'seo text checker' },
  { keyword: 'seo text checker free' },
  { keyword: 'seo text optimizer' },
  { keyword: 'seo title' },
  { keyword: 'seo title and description' },
  { keyword: 'seo title and description checker' },
  { keyword: 'seo title and meta description checker' },
  { keyword: 'seo title checker' },
  { keyword: 'seo title checker free' },
  { keyword: 'seo title description' },
  { keyword: 'seo title format' },
  { keyword: 'seo title length' },
  { keyword: 'seo title length checker' },
  { keyword: 'seo title preview' },
  { keyword: 'seo title tag' },
  { keyword: 'seo tool extension' },
  { keyword: 'seo tool keyword' },
  { keyword: 'seo tool meta description' },
  { keyword: 'seo tool online free' },
  { keyword: 'seo tool plugin' },
  { keyword: 'seo tool ranking' },
  { keyword: 'seo tool website check' },
  { keyword: 'seo tool wordpress' },
  { keyword: 'seo toolkit' },
  { keyword: 'seo tools' },
  { keyword: 'seo tools backlink checker' },
  { keyword: 'seo tools chrome' },
  { keyword: 'seo tools chrome extension' },
  { keyword: 'seo tools dashboard' },
  { keyword: 'seo tools examples' },
  { keyword: 'seo tools for beginners' },
  { keyword: 'seo tools for content writing' },
  { keyword: 'seo tools for digital marketing' },
  { keyword: 'seo tools for my website' },
  { keyword: 'seo tools for social media' },
  { keyword: 'seo tools for website' },
  { keyword: 'seo tools for website optimization' },
  { keyword: 'seo tools in wordpress' },
  { keyword: 'seo tools keyword checker' },
  { keyword: 'seo tools keyword research' },
  { keyword: 'seo tools site' },
  { keyword: 'seo tools to increase traffic' },
  { keyword: 'seo tools to use' },
  { keyword: 'seo tools white label' },
  { keyword: 'seo tools wordpress plugin' },
  { keyword: 'seo traffic' },
  { keyword: 'seo traffic checker' },
  { keyword: 'seo traffic tool' },
  { keyword: 'seo traffic website' },
  { keyword: 'seo trending keywords' },
  { keyword: 'seo untuk website' },
  { keyword: 'seo updates' },
  { keyword: 'seo url' },
  { keyword: 'seo url analyzer' },
  { keyword: 'seo uses' },
  { keyword: 'seo using ai' },
  { keyword: 'seo validator google' },
  { keyword: 'seo verification' },
  { keyword: 'seo views' },
  { keyword: 'seo visibility' },
  { keyword: 'seo visibility check' },
  { keyword: 'seo visibility score' },
  { keyword: 'seo visibility tool' },
  { keyword: 'seo web' },
  { keyword: 'seo web checker' },
  { keyword: 'seo web content' },
  { keyword: 'seo web search' },
  { keyword: 'seo web test' },
  { keyword: 'seo web traffic' },
  { keyword: 'seo webmaster tools' },
  { keyword: 'seo website' },
  { keyword: 'seo website analyzer free' },
  { keyword: 'seo website checker' },
  { keyword: 'seo website checker google' },
  { keyword: 'seo website help' },
  { keyword: 'seo website management' },
  { keyword: 'seo website score checker' },
  { keyword: 'seo website search' },
  { keyword: 'seo website traffic' },
  { keyword: 'seo what to do' },
  { keyword: 'seo with ai' },
  { keyword: 'seo work' },
  { keyword: 'seo writing' },
  { keyword: 'seo writing tools' },
  { keyword: 'seo your website' },
  { keyword: 'seo your website for free' },
  { keyword: 'seomofo google snippet' },
  { keyword: 'seomofo serp tool' },
  { keyword: 'seomofo snippet' },
  { keyword: 'seomofo snippet optimizer' },
  { keyword: 'seomofo tool' },
  { keyword: 'seoreviewtools content analysis' },
  { keyword: 'ser ranking' },
  { keyword: 'serp analysis' },
  { keyword: 'serp analysis tool' },
  { keyword: 'serp analysis tool free' },
  { keyword: 'serp analyzer' },
  { keyword: 'serp checker' },
  { keyword: 'serp checker extension' },
  { keyword: 'serp checker mangools' },
  { keyword: 'serp checker online' },
  { keyword: 'serp checker tool' },
  { keyword: 'serp checker tools' },
  { keyword: 'serp data' },
  { keyword: 'serp de google' },
  { keyword: 'serp display' },
  { keyword: 'serp do google' },
  { keyword: 'serp emulator' },
  { keyword: 'serp features' },
  { keyword: 'serp finder' },
  { keyword: 'serp free' },
  { keyword: 'serp free tool' },
  { keyword: 'serp generator' },
  { keyword: 'serp google api' },
  { keyword: 'serp impressions' },
  { keyword: 'serp in digital marketing' },
  { keyword: 'serp keyword research' },
  { keyword: 'serp keyword tool' },
  { keyword: 'serp length checker' },
  { keyword: 'serp mangools' },
  { keyword: 'serp marketing' },
  { keyword: 'serp meaning in seo' },
  { keyword: 'serp meta description' },
  { keyword: 'serp meta description tool' },
  { keyword: 'serp mockup' },
  { keyword: 'serp online' },
  { keyword: 'serp optimisation' },
  { keyword: 'serp optimization' },
  { keyword: 'serp optimization tool' },
  { keyword: 'serp optimizer' },
  { keyword: 'serp overview' },
  { keyword: 'serp page' },
  { keyword: 'serp pixel' },
  { keyword: 'serp plugin' },
  { keyword: 'serp position' },
  { keyword: 'serp position tool' },
  { keyword: 'serp preview' },
  { keyword: 'serp preview checker' },
  { keyword: 'serp preview tool' },
  { keyword: 'serp ranking' },
  { keyword: 'serp ranking check' },
  { keyword: 'serp ranking checker' },
  { keyword: 'serp rating' },
  { keyword: 'serp research tool' },
  { keyword: 'serp results' },
  { keyword: 'serp review' },
  { keyword: 'serp score' },
  { keyword: 'serp screenshot' },
  { keyword: 'serp search' },
  { keyword: 'serp search engine' },
  { keyword: 'serp seo' },
  { keyword: 'serp seo checker' },
  { keyword: 'serp seo tool' },
  { keyword: 'serp simulator' },
  { keyword: 'serp simulator google' },
  { keyword: 'serp snapshot' },
  { keyword: 'serp snippet' },
  { keyword: 'serp snippet checker' },
  { keyword: 'serp snippet generator' },
  { keyword: 'serp snippet optimization tool' },
  { keyword: 'serp snippet optimizer' },
  { keyword: 'serp snippet preview' },
  { keyword: 'serp snippet preview tool' },
  { keyword: 'serp snippet simulator' },
  { keyword: 'serp snippet tester' },
  { keyword: 'serp snippet tool' },
  { keyword: 'serp test' },
  { keyword: 'serp testing tool' },
  { keyword: 'serp title' },
  { keyword: 'serp title checker' },
  { keyword: 'serp tool free' },
  { keyword: 'serp tool google' },
  { keyword: 'serp tools' },
  { keyword: 'serp traffic' },
  { keyword: 'serp update' },
  { keyword: 'serp view' },
  { keyword: 'serp viewer' },
  { keyword: 'serp visibility' },
  { keyword: 'serp visualizer' },
  { keyword: 'serp website' },
  { keyword: 'serps simulator' },
  { keyword: 'service engine optimization' },
  { keyword: 'set up google review page' },
  { keyword: 'site analyzer tool' },
  { keyword: 'site check tool' },
  { keyword: 'site engine optimization' },
  { keyword: 'site keyword analysis tool' },
  { keyword: 'site optimization' },
  { keyword: 'site optimization checker' },
  { keyword: 'site optimization tools' },
  { keyword: 'site ranking checker free' },
  { keyword: 'site rating' },
  { keyword: 'site rating checker' },
  { keyword: 'site score checker' },
  { keyword: 'site search tools' },
  { keyword: 'site seo analysis' },
  { keyword: 'site seo checker' },
  { keyword: 'site seo checker free' },
  { keyword: 'site seo optimization' },
  { keyword: 'site seo score checker' },
  { keyword: 'site seo tester' },
  { keyword: 'site title' },
  { keyword: 'site to check website traffic' },
  { keyword: 'site traffic' },
  { keyword: 'site traffic checker' },
  { keyword: 'site traffic checker google' },
  { keyword: 'site web seo' },
  { keyword: 'snippet checker' },
  { keyword: 'snippet google' },
  { keyword: 'snippet optimiser' },
  { keyword: 'snippet optimization tool' },
  { keyword: 'snippet optimizer' },
  { keyword: 'snippet preview' },
  { keyword: 'snippet preview tool' },
  { keyword: 'snippet search' },
  { keyword: 'snippet search engine' },
  { keyword: 'snippet seo' },
  { keyword: 'snippet serp' },
  { keyword: 'snippets in seo' },
  { keyword: 'snippets tool' },
  { keyword: 'social media preview tool' },
  { keyword: 'social media search engine optimization' },
  { keyword: 'submit your site to google' },
  { keyword: 'submit your site to search engines' },
  { keyword: 'submit your url to search engines' },
  { keyword: 'submit your website to google' },
  { keyword: 'submit your website to search engines' },
  { keyword: 'tag tools' },
  { keyword: 'tags for tools' },
  { keyword: 'technical seo review' },
  { keyword: 'technical seo tool' },
  { keyword: 'test my seo' },
  { keyword: 'test my site seo' },
  { keyword: 'test my website seo' },
  { keyword: 'test page seo' },
  { keyword: 'test seo for website' },
  { keyword: 'test seo free' },
  { keyword: 'test seo website google' },
  { keyword: 'test serp' },
  { keyword: 'test website seo google' },
  { keyword: 'test website seo score' },
  { keyword: 'test your website seo' },
  { keyword: 'text seo' },
  { keyword: 'the best free seo tools' },
  { keyword: 'the best seo' },
  { keyword: 'the best seo tools' },
  { keyword: 'the new seo' },
  { keyword: 'the search engine' },
  { keyword: 'title optimization tool' },
  { keyword: 'title optimization tool free' },
  { keyword: 'title tag' },
  { keyword: 'title tag and meta description' },
  { keyword: 'title tag and meta description checker' },
  { keyword: 'title tag optimization' },
  { keyword: 'title tag preview tool' },
  { keyword: 'title tag tool' },
  { keyword: 'title tags and meta descriptions' },
  { keyword: 'toggle seo' },
  { keyword: 'tool check keyword' },
  { keyword: 'tool digital marketing' },
  { keyword: 'tool for website' },
  { keyword: 'tool google' },
  { keyword: 'tool seo keyword' },
  { keyword: 'tool to check traffic on a website' },
  { keyword: 'tool to check website traffic' },
  { keyword: 'tools by google' },
  { keyword: 'tools for on page seo' },
  { keyword: 'tools for seo keyword research' },
  { keyword: 'tools for seo keywords' },
  { keyword: 'tools for you' },
  { keyword: 'tools generator' },
  { keyword: 'tools google' },
  { keyword: 'tools in seo' },
  { keyword: 'tools link' },
  { keyword: 'tools page' },
  { keyword: 'tools seo free' },
  { keyword: 'tools to analyze website traffic' },
  { keyword: 'tools to improve seo' },
  { keyword: 'tools to you' },
  { keyword: 'tools traffic website' },
  { keyword: 'tools used for seo' },
  { keyword: 'tools web' },
  { keyword: 'tools websites' },
  { keyword: 'traffic checker' },
  { keyword: 'traffic checker google' },
  { keyword: 'traffic checker of website' },
  { keyword: 'traffic checker seo' },
  { keyword: 'traffic of the website' },
  { keyword: 'traffic site checker free' },
  { keyword: 'traffic to the website' },
  { keyword: 'traffic tools' },
  { keyword: 'traffic website checker free' },
  { keyword: 'trending seo' },
  { keyword: 'trending tools' },
  { keyword: 'understanding search engine optimization' },
  { keyword: 'up seo' },
  { keyword: 'update google review' },
  { keyword: 'update google search results for my website' },
  { keyword: 'update seo google' },
  { keyword: 'url analysis tool' },
  { keyword: 'url checker seo' },
  { keyword: 'url checker tool' },
  { keyword: 'url is on google' },
  { keyword: 'url optimization checker' },
  { keyword: 'url search engine' },
  { keyword: 'url seo' },
  { keyword: 'url seo checker' },
  { keyword: 'url tool' },
  { keyword: 'url traffic' },
  { keyword: 'use google search' },
  { keyword: 'use search engines' },
  { keyword: 'use seo' },
  { keyword: 'use seo tools' },
  { keyword: 'useful seo tools' },
  { keyword: 'visibility score seo' },
  { keyword: 'visible seo' },
  { keyword: 'ways to improve seo on your site' },
  { keyword: 'ways to optimize seo' },
  { keyword: 'web & seo' },
  { keyword: 'web analysis tool' },
  { keyword: 'web and seo' },
  { keyword: 'web optimization tools' },
  { keyword: 'web page analysis tool' },
  { keyword: 'web page meta description' },
  { keyword: 'web page optimization' },
  { keyword: 'web page preview' },
  { keyword: 'web page rating' },
  { keyword: 'web page review' },
  { keyword: 'web page seo' },
  { keyword: 'web page seo analyzer' },
  { keyword: 'web page seo check' },
  { keyword: 'web page seo test' },
  { keyword: 'web page traffic' },
  { keyword: 'web rating check' },
  { keyword: 'web search engine' },
  { keyword: 'web search engine optimization' },
  { keyword: 'web search optimization' },
  { keyword: 'web search tools' },
  { keyword: 'web seo' },
  { keyword: 'web seo analyzer' },
  { keyword: 'web seo checker' },
  { keyword: 'web seo online' },
  { keyword: 'web seo optimization' },
  { keyword: 'web seo tools' },
  { keyword: 'web tools' },
  { keyword: 'web traffic of a website' },
  { keyword: 'web traffic search' },
  { keyword: 'webpage seo check' },
  { keyword: 'website & seo' },
  { keyword: 'website analysis' },
  { keyword: 'website analysis checker' },
  { keyword: 'website analysis tool' },
  { keyword: 'website analysis website' },
  { keyword: 'website and seo' },
  { keyword: 'website check google' },
  { keyword: 'website checker' },
  { keyword: 'website checker tool' },
  { keyword: 'website content analysis tool' },
  { keyword: 'website content tool' },
  { keyword: 'website description' },
  { keyword: 'website for seo optimization' },
  { keyword: 'website free seo checker' },
  { keyword: 'website google rank' },
  { keyword: 'website google ranking checker' },
  { keyword: 'website google score' },
  { keyword: 'website keyword research tool' },
  { keyword: 'website keyword search tool' },
  { keyword: 'website meta description' },
  { keyword: 'website meta description generator' },
  { keyword: 'website meta tags' },
  { keyword: 'website metadata checker' },
  { keyword: 'website on page seo checker' },
  { keyword: 'website optimisation' },
  { keyword: 'website optimisation checker' },
  { keyword: 'website optimisation tools' },
  { keyword: 'website optimization' },
  { keyword: 'website optimization checker' },
  { keyword: 'website optimization tools' },
  { keyword: 'website optimization tools free' },
  { keyword: 'website page checker tool' },
  { keyword: 'website page seo checker' },
  { keyword: 'website page traffic' },
  { keyword: 'website page traffic checker' },
  { keyword: 'website popularity checker' },
  { keyword: 'website preview tool' },
  { keyword: 'website rank checker tool' },
  { keyword: 'website rank on google search' },
  { keyword: 'website ranking service' },
  { keyword: 'website ranking test' },
  { keyword: 'website ranking tools' },
  { keyword: 'website ranking tools free' },
  { keyword: 'website rating' },
  { keyword: 'website rating checker' },
  { keyword: 'website rating tool' },
  { keyword: 'website rating website' },
  { keyword: 'website research tool' },
  { keyword: 'website review tool' },
  { keyword: 'website score checker' },
  { keyword: 'website search optimization' },
  { keyword: 'website search results' },
  { keyword: 'website search tool' },
  { keyword: 'website seo' },
  { keyword: 'website seo analysis tool' },
  { keyword: 'website seo analyzer' },
  { keyword: 'website seo analyzer free' },
  { keyword: 'website seo checker chrome extension' },
  { keyword: 'website seo checker extension' },
  { keyword: 'website seo checker free' },
  { keyword: 'website seo checker google' },
  { keyword: 'website seo content' },
  { keyword: 'website seo help' },
  { keyword: 'website seo keyword research tool' },
  { keyword: 'website seo management' },
  { keyword: 'website seo meta tags' },
  { keyword: 'website seo online' },
  { keyword: 'website seo optimisation' },
  { keyword: 'website seo optimization' },
  { keyword: 'website seo optimization checker' },
  { keyword: 'website seo ranking' },
  { keyword: 'website seo ranking checker' },
  { keyword: 'website seo rating' },
  { keyword: 'website seo report' },
  { keyword: 'website seo report generator' },
  { keyword: 'website seo review' },
  { keyword: 'website seo score' },
  { keyword: 'website seo search' },
  { keyword: 'website seo software' },
  { keyword: 'website seo tools' },
  { keyword: 'website seo traffic' },
  { keyword: 'website seo traffic checker' },
  { keyword: 'website title' },
  { keyword: 'website title seo' },
  { keyword: 'website to check website traffic' },
  { keyword: 'website tools checker' },
  { keyword: 'website traffic' },
  { keyword: 'website traffic checker' },
  { keyword: 'website traffic checker for free' },
  { keyword: 'website traffic checker free' },
  { keyword: 'website traffic checker free google' },
  { keyword: 'website traffic checker google' },
  { keyword: 'website traffic checker tool free' },
  { keyword: 'website traffic checker tools' },
  { keyword: 'website traffic estimator google' },
  { keyword: 'website traffic free checker' },
  { keyword: 'website traffic overview' },
  { keyword: 'website traffic rank checker' },
  { keyword: 'website traffic rating' },
  { keyword: 'website traffic review' },
  { keyword: 'website traffic tester' },
  { keyword: 'website traffic tool' },
  { keyword: 'website traffic website' },
  { keyword: 'website via google' },
  { keyword: 'website visibility on google' },
  { keyword: 'white label seo' },
  { keyword: 'white label seo report' },
  { keyword: 'white label seo software' },
  { keyword: 'white label seo tool' },
  { keyword: 'white label tools' },
  { keyword: 'write a google review' },
  { keyword: 'write a meta description' },
  { keyword: 'writing seo content' },
  { keyword: 'writing seo optimized content' },
  { keyword: 'www google review' },
  { keyword: 'yoast seo tools' },
  { keyword: 'you seo' },
  { keyword: 'you tools seo' },
  { keyword: 'your keywords' },
  { keyword: 'your page title' },
  { keyword: 'your seo' }
];

export default function SERPPreviewer() {
  const [title, setTitle] = useState('Apex Utility Labs – Free Webmaster & SEO Optimization Tools');
  const [description, setDescription] = useState('Optimize your workspace vectors, compile documents, audit complete URL redirect paths, and parse configuration patterns locally with zero latency in your browser.');
  const [url, setUrl] = useState('https://apex-utility-labs.com/seo-suite');
  const [keywords, setKeywords] = useState('seo tools');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [serpPosition, setSerpPosition] = useState<number>(1);
  const [monthlyVolume, setMonthlyVolume] = useState<number>(10000);

  // AI CTR Optimizer States
  const [tone, setTone] = useState<string>('balanced');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<{
    seoAuditScore: number;
    auditFeedback: string[];
    titleSuggestions: Array<{ text: string; ctrBoostReason: string }>;
    descriptionSuggestions: Array<{ text: string; ctrBoostReason: string }>;
    keywordAnalysis: Array<{ keyword: string; foundInTitle: boolean; foundInDescription: boolean; recommendation: string }>;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAIOptimize = async () => {
    setIsOptimizing(true);
    setAiError(null);
    try {
      const response = await fetch('/api/serp-optimizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          keywords,
          url,
          tone,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      setAiResult(data);
    } catch (err: any) {
      console.error('Error optimizing SERP with AI:', err);
      setAiError(err.message || 'An unexpected error occurred during optimization.');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Keyword Targeting Checklist & Database States
  const [kwSearch, setKwSearch] = useState('');
  const [kwPage, setKwPage] = useState(0);
  const kwPerPage = 6;

  // Checker function for keyword target optimization
  const getKeywordStatus = (kw: string) => {
    const k = kw.toLowerCase();
    const inTitle = title.toLowerCase().includes(k);
    const inDesc = description.toLowerCase().includes(k);
    
    const slugified = k.replace(/\s+/g, '-');
    const inUrl = url.toLowerCase().includes(k) || url.toLowerCase().includes(slugified);
    
    const count = (inTitle ? 1 : 0) + (inDesc ? 1 : 0) + (inUrl ? 1 : 0);
    return { inTitle, inDesc, inUrl, count };
  };

  // Compute stats across the whole dataset
  const keywordStats = useMemo(() => {
    let activeCount = 0;
    let fullyOptimizedCount = 0;
    
    KEYWORD_DATABASE.forEach(item => {
      const status = getKeywordStatus(item.keyword);
      if (status.count > 0) {
        activeCount++;
      }
      if (status.inTitle && status.inDesc && status.inUrl) {
        fullyOptimizedCount++;
      }
    });

    const optimizedPercentage = KEYWORD_DATABASE.length > 0 
      ? Math.round((activeCount / KEYWORD_DATABASE.length) * 100) 
      : 0;

    return { activeCount, fullyOptimizedCount, optimizedPercentage };
  }, [title, description, url]);

  // Handle Search and Filter changes resetting page
  const handleSearchChange = (val: string) => {
    setKwSearch(val);
    setKwPage(0);
  };

  const filteredKeywords = useMemo(() => {
    return KEYWORD_DATABASE.filter(item => {
      return item.keyword.toLowerCase().includes(kwSearch.toLowerCase());
    });
  }, [kwSearch]);

  const paginatedKeywords = useMemo(() => {
    const start = kwPage * kwPerPage;
    return filteredKeywords.slice(start, start + kwPerPage);
  }, [filteredKeywords, kwPage]);

  const totalPages = Math.ceil(filteredKeywords.length / kwPerPage);

  // Rich Snippets Configuration
  const [richSnippets, setRichSnippets] = useState<RichSnippetOptions>({
    showStars: true,
    ratingValue: 4.9,
    reviewCount: 148,
    showDate: true,
    dateValue: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    showSitelinks: true,
    sitelinks: [
      { title: 'Sitemap Generator', url: '/sitemap-generator' },
      { title: 'Redirect Auditor', url: '/redirect-auditor' },
    ],
    showFaq: false,
    faqs: [
      { question: 'Are these webmaster utilities entirely free?', answer: 'Yes, all utilities are processed purely in-browser and are 100% free with no limits.' },
      { question: 'Is my data secure?', answer: 'Absolutely. All processing and document rendering is executed on your local client with zero server lags.' }
    ]
  });

  // Expandable settings states
  const [faqExpanded, setFaqExpanded] = useState<Record<number, boolean>>({});

  // Helper to copy text
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Preset quick templates
  const presets = [
    {
      name: 'E-Commerce Product',
      title: 'Craftsman Leather Goods – Premium Hand-Stitched Wallets',
      desc: 'Discover our curated selection of fine leather goods. Hand-stitched with premium full-grain Italian leather. 10-year warranty & free global shipping today!',
      url: 'https://leathercrafts.co/products/full-grain-wallet',
      snippets: {
        ...richSnippets,
        showStars: true,
        ratingValue: 4.8,
        reviewCount: 342,
        showDate: false,
      }
    },
    {
      name: 'Tech Blog Article',
      title: 'How to Optimize React Rendering Performance in 2026',
      desc: 'Unlock optimal render metrics in your React SPAs. Learn about the latest dynamic memoization hooks, state partitioning hacks, and web vitals optimization steps.',
      url: 'https://codeminds.dev/react/rendering-performance-tips',
      snippets: {
        ...richSnippets,
        showStars: false,
        showDate: true,
        dateValue: 'Jun 15, 2026',
      }
    },
    {
      name: 'Local Services',
      title: 'Elite HVAC Service Specialists – Instant 24/7 Home Repairs',
      desc: 'Local heating, ventilation, and air conditioning pros are on-call. Certified specialists offering transparent upfront pricing, direct warranties, and quick emergency callouts.',
      url: 'https://hvac-masters.net/services/emergency-repairs',
      snippets: {
        ...richSnippets,
        showStars: true,
        ratingValue: 4.9,
        reviewCount: 89,
        showDate: false,
      }
    }
  ];

  const applyPreset = (preset: typeof presets[number]) => {
    setTitle(preset.title);
    setDescription(preset.desc);
    setUrl(preset.url);
    setRichSnippets(preset.snippets);
  };

  // Pixel width math approximation (Google title caps at ~600px desktop, ~160 chars description ~960px)
  // Non-monospace average character widths
  const estimatePixelWidth = (text: string, isTitle: boolean) => {
    let width = 0;
    const factor = isTitle ? 10.2 : 7.8; // Appx pixel widths
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (/[A-Z]/.test(char)) width += factor * 1.25;
      else if (/[mw]/.test(char)) width += factor * 1.4;
      else if (/[ijl]/.test(char)) width += factor * 0.45;
      else if (/\s/.test(char)) width += factor * 0.5;
      else width += factor;
    }
    return Math.round(width);
  };

  const titlePixels = useMemo(() => estimatePixelWidth(title, true), [title]);
  const descPixels = useMemo(() => estimatePixelWidth(description, false), [description]);

  const TITLE_PIXEL_LIMIT = device === 'desktop' ? 600 : 540;
  const DESC_PIXEL_LIMIT = device === 'desktop' ? 960 : 720;

  const isTitleOver = titlePixels > TITLE_PIXEL_LIMIT || title.length > 60;
  const isDescOver = descPixels > DESC_PIXEL_LIMIT || description.length > 160;

  // SERP Position & CTR Analytics Math Engine
  const ctrAnalytics = useMemo(() => {
    const baseRates = [39.6, 18.4, 10.1, 7.2, 4.8, 3.1, 2.2, 1.6, 1.2, 1.0];
    
    // Active boosts list
    const activeBoosts = [];
    if (richSnippets.showStars) activeBoosts.push({ name: 'Review Stars Rating', value: 3.1 });
    if (richSnippets.showSitelinks) activeBoosts.push({ name: 'Sitelinks Assets', value: 4.2 });
    if (richSnippets.showFaq) activeBoosts.push({ name: 'FAQ Schema Snippet', value: 1.8 });
    if (richSnippets.showDate) activeBoosts.push({ name: 'Freshness Date Tag', value: 0.5 });
    if (!isTitleOver && !isDescOver && title.length > 30 && description.length > 80) {
      activeBoosts.push({ name: 'Perfect Tag Lengths', value: 1.2 });
    }
    
    const totalBoost = activeBoosts.reduce((acc, b) => acc + b.value, 0);
    
    // Generate data for Recharts
    const chartData = baseRates.map((base, idx) => {
      const pos = idx + 1;
      const opt = Math.min(95, parseFloat((base + totalBoost).toFixed(1)));
      return {
        position: `Pos ${pos}`,
        posNum: pos,
        'Base CTR %': base,
        'Snippet Projected %': opt,
      };
    });
    
    const selectedBase = baseRates[serpPosition - 1] || 1.0;
    const selectedProjected = Math.min(95, parseFloat((selectedBase + totalBoost).toFixed(1)));
    
    const baseClicks = Math.round((monthlyVolume * selectedBase) / 100);
    const projectedClicks = Math.round((monthlyVolume * selectedProjected) / 100);
    const trafficLiftPercent = selectedBase > 0 ? Math.round(((selectedProjected - selectedBase) / selectedBase) * 100) : 0;
    const clickLift = projectedClicks - baseClicks;
    
    return {
      chartData,
      activeBoosts,
      totalBoost,
      selectedBase,
      selectedProjected,
      baseClicks,
      projectedClicks,
      trafficLiftPercent,
      clickLift
    };
  }, [richSnippets, title, description, isTitleOver, isDescOver, serpPosition, monthlyVolume]);

  // Render text with highlight keywords
  const renderHighlightedText = (text: string, keywordStr: string, truncateLimit: number) => {
    if (!text) return '';
    
    // Trim to simulated display limit with ellipsis
    let renderedText = text;
    if (text.length > truncateLimit) {
      renderedText = text.substring(0, truncateLimit - 3) + '...';
    }

    if (!keywordStr.trim()) return <span>{renderedText}</span>;

    const queryParts = keywordStr.trim().split(/\s+/).filter(Boolean);
    if (queryParts.length === 0) return <span>{renderedText}</span>;

    // Build regex to match any of the keywords
    const esc = (s: string) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${queryParts.map(esc).join('|')})`, 'gi');

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    // Re-run regex over the rendered (potentially truncated) text
    while ((match = regex.exec(renderedText)) !== null) {
      const matchIndex = match.index;
      const matchText = match[0];

      if (matchIndex > lastIndex) {
        elements.push(<span key={lastIndex}>{renderedText.substring(lastIndex, matchIndex)}</span>);
      }
      elements.push(<strong key={matchIndex} className="text-[#3c4043] font-bold dark:text-zinc-200">{matchText}</strong>);
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < renderedText.length) {
      elements.push(<span key={lastIndex}>{renderedText.substring(lastIndex)}</span>);
    }

    return <>{elements}</>;
  };

  // Get Breadcrumbs from URL
  const getBreadcrumbs = (urlStr: string) => {
    try {
      if (!urlStr.startsWith('http')) {
        urlStr = 'https://' + urlStr;
      }
      const parsed = new URL(urlStr);
      const paths = parsed.pathname.split('/').filter(Boolean);
      return {
        domain: parsed.hostname,
        protocol: parsed.protocol,
        paths: paths
      };
    } catch {
      return {
        domain: urlStr || 'example.com',
        protocol: 'https:',
        paths: []
      };
    }
  };

  const breadcrumbs = useMemo(() => getBreadcrumbs(url), [url]);

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-500 uppercase">SEO Suite</span>
        <h2 className="text-2xl font-extrabold text-white tracking-tight font-sans">Google SERP Snippet Previewer</h2>
        <p className="text-zinc-400 text-xs sm:text-sm">
          Optimize your metadata for maximum click-through rates. Live pixel-perfect simulation of Google Search desktop and mobile SERP listings with real-time character truncations.
        </p>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Editor Panel (Left 5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-4">
            
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-brand" />
                Metadata Editor
              </span>
              <button 
                onClick={() => {
                  setTitle('');
                  setDescription('');
                  setUrl('');
                  setKeywords('');
                }}
                className="text-zinc-500 hover:text-red-400 transition-colors text-xs flex items-center gap-1"
                title="Clear inputs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>

            {/* Quick Preset Choice */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Load Preset Case:</span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map(p => (
                  <button
                    key={p.name}
                    onClick={() => applyPreset(p)}
                    className="text-[11px] font-mono bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-300 border border-zinc-800 px-2 py-1 rounded-lg transition-all"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-zinc-400">Meta Title</label>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                  isTitleOver ? 'text-red-400 bg-red-950/20' : 'text-emerald-400 bg-emerald-950/20'
                }`}>
                  {title.length} chars | {titlePixels}px / {TITLE_PIXEL_LIMIT}px
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter page SEO title..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all font-sans"
              />
              <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${isTitleOver ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, (titlePixels / TITLE_PIXEL_LIMIT) * 100)}%` }}
                />
              </div>
            </div>

            {/* URL Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-400">Page URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yourwebsite.com/page-slug"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all font-mono text-xs"
              />
            </div>

            {/* Description Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-zinc-400">Meta Description</label>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                  isDescOver ? 'text-red-400 bg-red-950/20' : 'text-emerald-400 bg-emerald-950/20'
                }`}>
                  {description.length} chars | {descPixels}px / {DESC_PIXEL_LIMIT}px
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Enter page SEO meta description..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all font-sans resize-y leading-relaxed text-xs"
              />
              <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${isDescOver ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, (descPixels / DESC_PIXEL_LIMIT) * 100)}%` }}
                />
              </div>
            </div>

            {/* Keyword Highlighter */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-zinc-500" />
                Highlight Keywords (Google Emulation)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. seo tools document optimization"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all font-sans text-xs"
              />
            </div>
          </div>

          {/* Rich Snippets Control Panel */}
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-3">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              Interactive Rich Snippets
            </span>

            {/* Star Ratings toggle */}
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={richSnippets.showStars}
                  onChange={(e) => setRichSnippets({ ...richSnippets, showStars: e.target.checked })}
                  className="rounded border-zinc-800 bg-zinc-900 text-brand focus:ring-brand"
                />
                Show Reviews / Rating Schema
              </label>

              {richSnippets.showStars && (
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Rating Score</span>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={richSnippets.ratingValue}
                      onChange={(e) => setRichSnippets({ ...richSnippets, ratingValue: parseFloat(e.target.value) || 5.0 })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Vote Count</span>
                    <input
                      type="number"
                      value={richSnippets.reviewCount}
                      onChange={(e) => setRichSnippets({ ...richSnippets, reviewCount: parseInt(e.target.value) || 0 })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Date toggle */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={richSnippets.showDate}
                  onChange={(e) => setRichSnippets({ ...richSnippets, showDate: e.target.checked })}
                  className="rounded border-zinc-800 bg-zinc-900 text-brand focus:ring-brand"
                />
                Include Article Published Date
              </label>

              {richSnippets.showDate && (
                <div className="pl-6 space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Publication Date Label</span>
                  <input
                    type="text"
                    value={richSnippets.dateValue}
                    onChange={(e) => setRichSnippets({ ...richSnippets, dateValue: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
              )}
            </div>

            {/* Dynamic Sitelinks */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={richSnippets.showSitelinks}
                  onChange={(e) => setRichSnippets({ ...richSnippets, showSitelinks: e.target.checked })}
                  className="rounded border-zinc-800 bg-zinc-900 text-brand focus:ring-brand"
                />
                Simulate Organic Sitelinks
              </label>

              {richSnippets.showSitelinks && (
                <div className="pl-6 space-y-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Custom Secondary Links</span>
                  {richSnippets.sitelinks.map((link, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={link.title}
                        placeholder="Link Label"
                        onChange={(e) => {
                          const updated = [...richSnippets.sitelinks];
                          updated[idx].title = e.target.value;
                          setRichSnippets({ ...richSnippets, sitelinks: updated });
                        }}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={link.url}
                        placeholder="Link Path"
                        onChange={(e) => {
                          const updated = [...richSnippets.sitelinks];
                          updated[idx].url = e.target.value;
                          setRichSnippets({ ...richSnippets, sitelinks: updated });
                        }}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FAQ Rich snippet */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={richSnippets.showFaq}
                  onChange={(e) => setRichSnippets({ ...richSnippets, showFaq: e.target.checked })}
                  className="rounded border-zinc-800 bg-zinc-900 text-brand focus:ring-brand"
                />
                Show FAQ Schema Accordion
              </label>

              {richSnippets.showFaq && (
                <div className="pl-6 space-y-3">
                  {richSnippets.faqs.map((faq, idx) => (
                    <div key={idx} className="space-y-1.5 p-2.5 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
                      <span className="text-[9px] font-bold font-mono text-emerald-400 block uppercase">Question #{idx + 1}</span>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => {
                          const updated = [...richSnippets.faqs];
                          updated[idx].question = e.target.value;
                          setRichSnippets({ ...richSnippets, faqs: updated });
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-xs text-white"
                      />
                      <textarea
                        value={faq.answer}
                        rows={2}
                        onChange={(e) => {
                          const updated = [...richSnippets.faqs];
                          updated[idx].answer = e.target.value;
                          setRichSnippets({ ...richSnippets, faqs: updated });
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-xs text-white text-[11px]"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Simulator View (Right 7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Controls bar (Desktop/Mobile selection, copy buttons) */}
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
            <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl">
              <button
                onClick={() => setDevice('desktop')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  device === 'desktop' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                Desktop View
              </button>
              <button
                onClick={() => setDevice('mobile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  device === 'mobile' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Mobile View
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(title, 'title')}
                className="text-[11px] font-mono text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-zinc-800"
              >
                {copiedText === 'title' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                Copy Title
              </button>
              <button
                onClick={() => handleCopy(description, 'description')}
                className="text-[11px] font-mono text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-zinc-800"
              >
                {copiedText === 'description' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                Copy Description
              </button>
            </div>
          </div>

          {/* The Google Mock Container */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl text-[#202124] font-sans antialiased">
            {/* Top Bar simulating a real browser or Google search header */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-500 font-mono flex items-center gap-1.5 truncate">
                <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>Google Search:</span>
                <span className="text-gray-900 font-bold font-sans truncate">{keywords || title || 'your search query'}</span>
              </div>
            </div>

            {/* Result Area */}
            <div className="p-6 md:p-8 space-y-6">
              
              {/* Google Result block */}
              {device === 'desktop' ? (
                /* DESKTOP SERP INTERFACE */
                <div className="max-w-[600px] space-y-1 text-left">
                  {/* Breadcrumbs Row */}
                  <div className="flex items-center gap-1 text-[12px] text-[#202124] leading-relaxed truncate">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 text-gray-500 mr-1 shrink-0">
                      <Globe className="w-2.5 h-2.5" />
                    </span>
                    <span className="font-sans truncate">{breadcrumbs.domain}</span>
                    {breadcrumbs.paths.length > 0 && (
                      <span className="text-gray-400 flex items-center gap-1 text-[11px] font-mono">
                        <span>›</span>
                        <span className="truncate">{breadcrumbs.paths.join(' › ')}</span>
                      </span>
                    )}
                  </div>

                  {/* Title Row (Google Desktop max width roughly 600px, usually text truncates at ~60-65 chars depending on character width) */}
                  <h3 className="text-xl font-sans font-medium text-[#1a0dab] hover:underline cursor-pointer leading-[1.3] truncate break-words">
                    {title || 'Please enter a Meta Title'}
                  </h3>

                  {/* Rich Snippet: Star Rating Row */}
                  {richSnippets.showStars && (
                    <div className="flex items-center gap-1 text-sm text-[#4d5156] py-0.5">
                      <div className="flex items-center text-[#f1c40f]">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            className={`w-3.5 h-3.5 ${
                              s <= Math.floor(richSnippets.ratingValue) 
                                ? 'fill-[#f1c40f]' 
                                : s - 0.5 <= richSnippets.ratingValue 
                                  ? 'fill-[#f1c40f]/60' 
                                  : 'text-gray-300'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-xs text-[#70757a] font-mono">
                        Rating: {richSnippets.ratingValue.toFixed(1)} · ‎{richSnippets.reviewCount} votes
                      </span>
                    </div>
                  )}

                  {/* Description & Snippet row */}
                  <p className="text-sm text-[#4d5156] leading-[1.58] break-words">
                    {richSnippets.showDate && (
                      <span className="text-gray-500 text-[13px] mr-1 font-sans">{richSnippets.dateValue} —</span>
                    )}
                    {renderHighlightedText(description || 'Please enter a Meta Description for your website to outline its core purposes in Google Search outcomes.', keywords, 160)}
                  </p>

                  {/* Sitelinks simulation */}
                  {richSnippets.showSitelinks && (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 pt-3.5 pl-3 border-l-2 border-gray-100">
                      {richSnippets.sitelinks.map((sitelink, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <span className="text-[#1a0dab] text-[13px] hover:underline cursor-pointer font-sans block truncate">
                            {sitelink.title || `Sitelink #${idx + 1}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Accordion FAQ Schema simulation */}
                  {richSnippets.showFaq && (
                    <div className="pt-3.5 space-y-2 border-t border-gray-100 mt-3 max-w-[580px]">
                      {richSnippets.faqs.map((faq, idx) => {
                        const isOpen = !!faqExpanded[idx];
                        return (
                          <div key={idx} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                            <button
                              onClick={() => setFaqExpanded({ ...faqExpanded, [idx]: !isOpen })}
                              className="w-full flex items-center justify-between text-left text-sm text-[#1a0dab] hover:underline hover:text-[#1a0dab] transition-all font-sans font-medium"
                            >
                              <span>{faq.question || `FAQ Question #${idx + 1}`}</span>
                              {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            </button>
                            {isOpen && (
                              <p className="mt-1.5 text-xs text-[#4d5156] leading-relaxed pl-1 transition-all">
                                {faq.answer || `Placeholder Answer for Question #${idx + 1}`}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* MOBILE SERP INTERFACE */
                <div className="max-w-[420px] mx-auto border border-gray-200 rounded-xl p-4 bg-white shadow-inner space-y-2 text-left">
                  {/* Site identity header */}
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <Globe className="w-3.5 h-3.5 text-gray-500" />
                    </span>
                    <div className="text-xs leading-tight">
                      <p className="font-semibold text-[#202124]">{breadcrumbs.domain}</p>
                      <p className="text-[#70757a] font-mono text-[10px] truncate">{url || 'example.com'}</p>
                    </div>
                  </div>

                  {/* Mobile Title row */}
                  <h3 className="text-[17px] font-sans font-medium text-[#1a0dab] active:text-[#1a0dab]/80 leading-snug cursor-pointer block line-clamp-2">
                    {title || 'Please enter a Meta Title'}
                  </h3>

                  {/* Rich Snippet: Rating row */}
                  {richSnippets.showStars && (
                    <div className="flex items-center gap-1 text-xs text-[#4d5156]">
                      <div className="flex items-center text-[#f1c40f]">
                        <Star className="w-3 h-3 fill-[#f1c40f]" />
                      </div>
                      <span>
                        {richSnippets.ratingValue.toFixed(1)} ★ ({richSnippets.reviewCount} reviews)
                      </span>
                    </div>
                  )}

                  {/* Mobile Description & Content */}
                  <p className="text-[13px] text-[#4d5156] leading-[1.5] line-clamp-3">
                    {richSnippets.showDate && (
                      <span className="text-gray-500 text-[12px] mr-1 font-sans">{richSnippets.dateValue} —</span>
                    )}
                    {renderHighlightedText(description || 'Please enter a Meta Description for your website to outline its core purposes in Google Search outcomes.', keywords, 120)}
                  </p>

                  {/* FAQ mobile row list */}
                  {richSnippets.showFaq && (
                    <div className="pt-2 mt-2 border-t border-gray-100 space-y-1.5">
                      {richSnippets.faqs.slice(0, 1).map((faq, idx) => (
                        <div key={idx} className="text-xs text-gray-500">
                          <p className="font-semibold text-gray-800">{faq.question}</p>
                          <p className="mt-0.5 leading-relaxed">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* SERP Position & CTR Analytics Panel */}
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-500 uppercase flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  CTR Forecasting
                </span>
                <h3 className="text-lg font-extrabold text-white tracking-tight font-sans">
                  SERP Position & CTR Analytics
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded-md self-start sm:self-center">
                Interactive Forecasting
              </span>
            </div>

            <p className="text-zinc-400 text-xs leading-relaxed">
              Google's organic Click-Through Rate drops exponentially as your search listing moves down the results page. Optimize your rich snippet elements and tags to capture a massive CTR boost.
            </p>

            {/* Interactive Simulation Controls */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Position selector */}
              <div className="md:col-span-7 space-y-2.5">
                <label className="text-xs font-semibold text-zinc-400 block">
                  Simulate Google Ranking Position
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((pos) => {
                    const isActive = serpPosition === pos;
                    return (
                      <button
                        key={pos}
                        onClick={() => setSerpPosition(pos)}
                        className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500 border-emerald-400 text-black shadow-lg shadow-emerald-500/20'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/80 hover:text-white'
                        }`}
                      >
                        #{pos}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Volume selector */}
              <div className="md:col-span-5 space-y-2.5">
                <label className="text-xs font-semibold text-zinc-400 block">
                  Target Keyword Monthly Volume
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    max="10000000"
                    step="500"
                    value={monthlyVolume}
                    onChange={(e) => setMonthlyVolume(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-xl pl-3 pr-10 py-2 text-sm text-white focus:outline-none transition-all font-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-mono text-zinc-500">
                    S/Mo
                  </span>
                </div>
                <div className="flex gap-1.5 justify-between">
                  {[1000, 5000, 10000, 50000].map((v) => (
                    <button
                      key={v}
                      onClick={() => setMonthlyVolume(v)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all border cursor-pointer ${
                        monthlyVolume === v
                          ? 'bg-zinc-800 border-zinc-700 text-white'
                          : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {v.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: CTR */}
              <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 space-y-1.5 text-left">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Projected CTR</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-white font-mono">
                    {ctrAnalytics.selectedProjected}%
                  </span>
                  <span className="text-xs text-zinc-500 line-through font-mono">
                    {ctrAnalytics.selectedBase}%
                  </span>
                </div>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  +{ctrAnalytics.totalBoost.toFixed(1)}% Rich Snippet Lift
                </p>
              </div>

              {/* Card 2: Estimated Monthly Clicks */}
              <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 space-y-1.5 text-left">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Expected Clicks</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-white font-mono">
                    {ctrAnalytics.projectedClicks.toLocaleString()}
                  </span>
                  <span className="text-xs text-zinc-500 line-through font-mono">
                    {ctrAnalytics.baseClicks.toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono">
                  Monthly visits from Position #{serpPosition}
                </p>
              </div>

              {/* Card 3: Traffic Lift */}
              <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 space-y-1.5 text-left">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Traffic Increase</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                    +{ctrAnalytics.trafficLiftPercent}%
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    (+{ctrAnalytics.clickLift.toLocaleString()}/mo)
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono">
                  Snippet optimization value
                </p>
              </div>
            </div>

            {/* Recharts Chart */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1 text-left">
                Organic Click-Through Rate Curve (SERP Position 1-10)
              </span>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={ctrAnalytics.chartData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="optColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="baseColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#64748b" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="position"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      unit="%"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          const isCurrent = item.posNum === serpPosition;
                          return (
                            <div className="bg-zinc-950/95 border border-zinc-800 p-3 rounded-lg shadow-xl text-xs space-y-1.5 font-sans text-left">
                              <p className="font-bold text-white flex items-center justify-between gap-4">
                                <span>Google Position #{item.posNum}</span>
                                {isCurrent && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">
                                    Simulating
                                  </span>
                                )}
                              </p>
                              <div className="space-y-1 font-mono text-[11px] text-zinc-400">
                                <p className="flex justify-between gap-6">
                                  <span>Baseline CTR:</span>
                                  <span className="text-zinc-300 font-bold">{item['Base CTR %']}%</span>
                                </p>
                                <p className="flex justify-between gap-6 text-emerald-400">
                                  <span>Your Snippet CTR:</span>
                                  <span className="font-bold">{item['Snippet Projected %']}%</span>
                                </p>
                                <p className="flex justify-between gap-6 text-zinc-500 text-[10px] border-t border-zinc-900 pt-1">
                                  <span>Proj. Clicks:</span>
                                  <span>{Math.round((monthlyVolume * item['Snippet Projected %']) / 100).toLocaleString()}</span>
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Snippet Projected %"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#optColor)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Base CTR %"
                      stroke="#64748b"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#baseColor)"
                    />
                    <ReferenceLine
                      x={`Pos ${serpPosition}`}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Rich Snippets CTR Boosters Checklist */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block text-left">
                Snippet Feature CTR Boosters Inventory
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    name: 'Review Stars Rating',
                    value: '+3.1% CTR',
                    desc: 'Enhance visibility with schema reviews.',
                    active: richSnippets.showStars,
                    icon: Star,
                    color: 'text-amber-400'
                  },
                  {
                    name: 'Sitelinks Assets',
                    value: '+4.2% CTR',
                    desc: 'Expand snippet with internal direct links.',
                    active: richSnippets.showSitelinks,
                    icon: Link,
                    color: 'text-blue-400'
                  },
                  {
                    name: 'FAQ Schema Snippet',
                    value: '+1.8% CTR',
                    desc: 'Dominate more vertical SERP screen area.',
                    active: richSnippets.showFaq,
                    icon: HelpCircle,
                    color: 'text-purple-400'
                  },
                  {
                    name: 'Freshness Date Tag',
                    value: '+0.5% CTR',
                    desc: 'Indicate recently updated dynamic content.',
                    active: richSnippets.showDate,
                    icon: Info,
                    color: 'text-rose-400'
                  },
                  {
                    name: 'Perfect Title & Desc Lengths',
                    value: '+1.2% CTR',
                    desc: 'Avoid search snippet truncations in results.',
                    active: !isTitleOver && !isDescOver && title.length > 30 && description.length > 80,
                    icon: CheckCircle2,
                    color: 'text-emerald-400'
                  }
                ].map((booster, idx) => {
                  const IconComp = booster.icon;
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex gap-3 transition-all ${
                        booster.active
                          ? 'bg-emerald-950/15 border-emerald-500/20 text-white'
                          : 'bg-zinc-900/20 border-zinc-800/40 text-zinc-500'
                      }`}
                    >
                      <IconComp className={`w-4 h-4 shrink-0 mt-0.5 ${booster.active ? booster.color : 'text-zinc-600'}`} />
                      <div className="space-y-0.5 text-left min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-bold leading-none truncate ${booster.active ? 'text-zinc-200' : 'text-zinc-500'}`}>
                            {booster.name}
                          </p>
                          <span className={`text-[10px] font-mono font-bold shrink-0 ${booster.active ? 'text-emerald-400' : 'text-zinc-600'}`}>
                            {booster.value}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-tight truncate">
                          {booster.desc}
                        </p>
                        <span className={`inline-block text-[9px] font-mono font-semibold uppercase ${booster.active ? 'text-emerald-500' : 'text-zinc-600'}`}>
                          {booster.active ? 'Active Boost' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Snippet Optimizer & CTR Booster Panel */}
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-900 pb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                AI Snippet Optimizer & CTR Booster
              </span>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full">
                Powered by Gemini 3.5 Flash
              </span>
            </div>

            <p className="text-zinc-400 text-xs leading-relaxed">
              Analyze your metadata and instantly craft several search-optimized titles and descriptions designed to maximize Click-Through Rate (CTR) and keyword coverage.
            </p>

            {/* Select Optimization tone */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">1. Select Copywriting Framework / Tone Goal</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {[
                  { id: 'balanced', label: 'Balanced', desc: 'Standard professional SEO alignment' },
                  { id: 'clickbait', label: 'High CTR', desc: 'Emotional power words & click magnets' },
                  { id: 'curiosity', label: 'Curiosity Gap', desc: 'Intriguing questions & open loops' },
                  { id: 'benefit', label: 'Benefit-First', desc: 'Immediate value & value proposition' },
                  { id: 'urgency', label: 'Urgency / Action', desc: 'Compelling action verbs' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTone(item.id)}
                    className={`p-2.5 rounded-xl text-left border text-xs transition-all flex flex-col justify-between h-20 group relative cursor-pointer ${
                      tone === item.id
                        ? 'bg-emerald-500/10 border-emerald-500 text-white'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/80'
                    }`}
                  >
                    <span className="font-bold block transition-colors group-hover:text-white">
                      {item.label}
                    </span>
                    <span className="text-[9px] text-zinc-500 leading-tight block">
                      {item.desc}
                    </span>
                    {tone === item.id && (
                      <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <div className="flex justify-end pt-1">
              <button
                onClick={handleAIOptimize}
                disabled={isOptimizing}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isOptimizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Optimizing Snippet Assets...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Run AI Snippet Audit & Optimize
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{aiError}</p>
              </div>
            )}

            {/* Results Display */}
            {aiResult && (
              <div className="space-y-6 pt-3 border-t border-zinc-900 animate-fadeIn text-left">
                
                {/* Score & Feedback Row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                  {/* Score */}
                  <div className="md:col-span-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">AI SEO Score</span>
                    
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-zinc-800"
                          strokeWidth="2.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className={
                            aiResult.seoAuditScore >= 80 ? "text-emerald-500" :
                            aiResult.seoAuditScore >= 50 ? "text-amber-500" : "text-red-500"
                          }
                          strokeWidth="2.5"
                          strokeDasharray={`${aiResult.seoAuditScore}, 100`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="text-xl font-extrabold text-white font-mono">
                        {aiResult.seoAuditScore}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      aiResult.seoAuditScore >= 80 ? "bg-emerald-950/40 text-emerald-400" :
                      aiResult.seoAuditScore >= 50 ? "bg-amber-950/40 text-amber-400" : "bg-red-950/40 text-red-400"
                    }`}>
                      {aiResult.seoAuditScore >= 80 ? "Excellent" :
                       aiResult.seoAuditScore >= 50 ? "Needs Work" : "Critical"}
                    </span>
                  </div>

                  {/* Audit Feedback */}
                  <div className="md:col-span-8 bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 space-y-2">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block">Actionable AI Findings</span>
                    <ul className="space-y-1.5 text-xs text-zinc-300 pl-1">
                      {aiResult.auditFeedback.map((feedback, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          <span>{feedback}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Optimized Titles */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">2. High-Performance Page Title Rewrites</span>
                  <div className="space-y-2">
                    {aiResult.titleSuggestions.map((suggestion, idx) => {
                      const suggPixels = estimatePixelWidth(suggestion.text, true);
                      const isSuggOver = suggPixels > 600 || suggestion.text.length > 60;
                      return (
                        <div key={idx} className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3 space-y-2 hover:border-zinc-800 transition-all">
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-1 flex-1 min-w-0 text-left">
                              <p className="text-xs font-bold text-white break-words">
                                {suggestion.text}
                              </p>
                              <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-400" />
                                {suggestion.ctrBoostReason}
                              </p>
                            </div>
                            
                            <div className="flex gap-1.5 shrink-0">
                              <button
                                onClick={() => {
                                  setTitle(suggestion.text);
                                  handleCopy(suggestion.text, `sugg-title-${idx}`);
                                }}
                                className="px-2.5 py-1 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-300 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                {copiedText === `sugg-title-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Plus className="w-3 h-3" />}
                                {copiedText === `sugg-title-${idx}` ? 'Applied' : 'Apply'}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
                            <span>{suggestion.text.length} chars</span>
                            <span className={isSuggOver ? 'text-red-400' : 'text-emerald-400'}>
                              {suggPixels}px / 600px
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Optimized Descriptions */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">3. High-CTR Meta Description Rewrites</span>
                  <div className="space-y-2">
                    {aiResult.descriptionSuggestions.map((suggestion, idx) => {
                      const suggPixels = estimatePixelWidth(suggestion.text, false);
                      const isSuggOver = suggPixels > 960 || suggestion.text.length > 155;
                      return (
                        <div key={idx} className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3 space-y-2 hover:border-zinc-800 transition-all">
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-1 flex-1 min-w-0 text-left">
                              <p className="text-xs text-zinc-300 leading-relaxed break-words">
                                {suggestion.text}
                              </p>
                              <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-400" />
                                {suggestion.ctrBoostReason}
                              </p>
                            </div>
                            
                            <div className="flex gap-1.5 shrink-0">
                              <button
                                onClick={() => {
                                  setDescription(suggestion.text);
                                  handleCopy(suggestion.text, `sugg-desc-${idx}`);
                                }}
                                className="px-2.5 py-1 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-300 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                {copiedText === `sugg-desc-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Plus className="w-3 h-3" />}
                                {copiedText === `sugg-desc-${idx}` ? 'Applied' : 'Apply'}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
                            <span>{suggestion.text.length} chars</span>
                            <span className={isSuggOver ? 'text-red-400' : 'text-emerald-400'}>
                              {suggPixels}px / 960px
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Keyword Analysis */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">4. AI Keyword Target Analysis</span>
                  <div className="overflow-x-auto rounded-xl border border-zinc-900 bg-zinc-950/40 text-left">
                    <table className="w-full text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-zinc-900/60 text-zinc-500 uppercase font-mono text-[9px] border-b border-zinc-900">
                          <th className="p-2.5">Keyword</th>
                          <th className="p-2.5 text-center">Title</th>
                          <th className="p-2.5 text-center">Description</th>
                          <th className="p-2.5">AI Pro Advice</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900 text-zinc-300">
                        {aiResult.keywordAnalysis.map((analysis, idx) => (
                          <tr key={idx} className="hover:bg-zinc-900/20">
                            <td className="p-2.5 font-bold text-white whitespace-nowrap">
                              {analysis.keyword}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                                analysis.foundInTitle ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/10' : 'bg-zinc-900 text-zinc-500'
                              }`}>
                                {analysis.foundInTitle ? 'YES' : 'NO'}
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                                analysis.foundInDescription ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/10' : 'bg-zinc-900 text-zinc-500'
                              }`}>
                                {analysis.foundInDescription ? 'YES' : 'NO'}
                              </span>
                            </td>
                            <td className="p-2.5 text-zinc-400 leading-snug">
                              {analysis.recommendation}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Expert SEO Recommendations Panel */}
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 sm:p-6 shadow-lg space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              SEO Quality Audit Checklist
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title feedback */}
              <div className={`p-4 rounded-xl border space-y-2 ${
                isTitleOver 
                  ? 'bg-red-950/10 border-red-500/20 text-red-300' 
                  : title.length < 30 
                    ? 'bg-amber-950/10 border-amber-500/20 text-amber-300' 
                    : 'bg-emerald-950/10 border-emerald-500/20 text-emerald-300'
              }`}>
                <div className="flex items-center gap-2">
                  {isTitleOver ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : title.length < 30 ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <h4 className="text-xs font-bold uppercase tracking-wider">Title Length</h4>
                </div>
                <p className="text-[11px] leading-relaxed font-mono">
                  {isTitleOver 
                    ? `Your title occupies ${titlePixels}px (${title.length} chars). It exceeds Google's maximum display threshold of 600 pixels (~60 chars). Search results will append a trailing ellipsis (...), which might cut off vital marketing messages.`
                    : title.length < 30 
                      ? 'Your title is shorter than 30 characters. Expand it with relevant keyword combinations and search intent phrases to maximize visibility and index reach.'
                      : 'Perfect! Your title is well-proportioned, fits Google\'s size limits, and ensures pristine display across all screen categories.'
                  }
                </p>
              </div>

              {/* Description feedback */}
              <div className={`p-4 rounded-xl border space-y-2 ${
                isDescOver 
                  ? 'bg-red-950/10 border-red-500/20 text-red-300' 
                  : description.length < 70 
                    ? 'bg-amber-950/10 border-amber-500/20 text-amber-300' 
                    : 'bg-emerald-950/10 border-emerald-500/20 text-emerald-300'
              }`}>
                <div className="flex items-center gap-2">
                  {isDescOver ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : description.length < 70 ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <h4 className="text-xs font-bold uppercase tracking-wider">Description Length</h4>
                </div>
                <p className="text-[11px] leading-relaxed font-mono">
                  {isDescOver 
                    ? `Your meta description is ${description.length} chars (${descPixels}px). It exceeds Google's typical desktop limit of 160 characters (or mobile 120 characters). Google will truncate your text.`
                    : description.length < 70 
                      ? 'Your description is very short. Expand it up to 120-155 characters to fully outline features, increase query matches, and maximize organic click-through rates.'
                      : 'Excellent! Your meta description uses space effectively, keeping important summaries visible to search clients.'
                  }
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Target Keyword Optimization Hub */}
      <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-6 mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-500 uppercase flex items-center gap-1.5">
              <Target className="w-3 h-3" /> Real-time SEO Analyzer
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Focus Keywords & Search Visibility Hub
            </h3>
            <p className="text-zinc-400 text-xs">
              Check real-time alignment of your targeted search index keywords. Optimize titles, descriptions, and slugs to improve visibility.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <div className="bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 uppercase text-[9px] block">Targeted Keywords</span>
              <span className="text-emerald-400 font-bold text-sm">{keywordStats.activeCount} <span className="text-zinc-600 text-xs font-normal">/ {KEYWORD_DATABASE.length}</span></span>
            </div>
            <div className="bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 uppercase text-[9px] block">Fully Optimized</span>
              <span className="text-blue-400 font-bold text-sm">{keywordStats.fullyOptimizedCount} <span className="text-zinc-600 text-xs">keywords</span></span>
            </div>
            <div className="bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 uppercase text-[9px] block">Optimization Rate</span>
              <span className="text-amber-400 font-bold text-sm">{keywordStats.optimizedPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Search & Actions bar */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search focus keywords..."
                value={kwSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="text-zinc-500 text-xs">
            Showing <strong className="text-zinc-300">{filteredKeywords.length}</strong> matching organic focus keywords
          </div>
        </div>

        {/* Keywords Table list */}
        <div className="overflow-x-auto rounded-xl border border-zinc-900 bg-zinc-950/40">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-900/60 text-zinc-400 uppercase font-mono text-[9px] tracking-wider border-b border-zinc-900">
                <th className="p-3.5">Organic Keyword</th>
                <th className="p-3.5">Metadata Placement Status (Title / Desc / Slug)</th>
                <th className="p-3.5 text-center">Coverage Level</th>
                <th className="p-3.5 text-center">Quick Optimization Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {paginatedKeywords.length > 0 ? (
                paginatedKeywords.map((item, idx) => {
                  const status = getKeywordStatus(item.keyword);
                  const isFullyOptimized = status.inTitle && status.inDesc && status.inUrl;
                  const isPartiallyOptimized = status.count > 0 && !isFullyOptimized;
                  
                  return (
                    <tr 
                      key={idx} 
                      className={`hover:bg-zinc-900/20 transition-colors ${
                        isFullyOptimized ? 'bg-emerald-950/[0.02]' : isPartiallyOptimized ? 'bg-blue-950/[0.01]' : ''
                      }`}
                    >
                      <td className="p-3.5">
                        <span className="font-semibold text-zinc-200 block text-sm">{item.keyword}</span>
                      </td>
                      
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          {/* Title indicator */}
                          <span 
                            title={status.inTitle ? "Found in Meta Title!" : "Missing from Meta Title"}
                            className={`px-2 py-1 rounded font-mono text-[10px] border transition-all ${
                              status.inTitle 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold' 
                                : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                            }`}
                          >
                            Title
                          </span>
                          {/* Description indicator */}
                          <span 
                            title={status.inDesc ? "Found in Meta Description!" : "Missing from Meta Description"}
                            className={`px-2 py-1 rounded font-mono text-[10px] border transition-all ${
                              status.inDesc 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold' 
                                : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                            }`}
                          >
                            Desc
                          </span>
                          {/* URL indicator */}
                          <span 
                            title={status.inUrl ? "Found in URL slug!" : "Missing from URL slug"}
                            className={`px-2 py-1 rounded font-mono text-[10px] border transition-all ${
                              status.inUrl 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold' 
                                : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                            }`}
                          >
                            Slug
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                          isFullyOptimized 
                            ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20'
                            : isPartiallyOptimized
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                        }`}>
                          {isFullyOptimized ? '✓ Perfect Match' : isPartiallyOptimized ? '⚠ Partial Match' : 'Unoptimized'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setKeywords(item.keyword)}
                            title="Set as active SERP highlight filter"
                            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-all hover:bg-zinc-800 cursor-pointer ${
                              keywords === item.keyword 
                                ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400' 
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Highlight
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setTitle(prev => {
                                const trimPrev = prev.trim();
                                if (!trimPrev) return item.keyword;
                                return `${item.keyword} – ${trimPrev}`;
                              });
                            }}
                            title="Prepend keyword to Meta Title"
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center gap-0.5 text-[10px] cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Title
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDescription(prev => {
                                const trimPrev = prev.trim();
                                if (!trimPrev) return `Learn more about ${item.keyword}.`;
                                return `${item.keyword}: ${trimPrev}`;
                              });
                            }}
                            title="Prepend keyword to Meta Description"
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center gap-0.5 text-[10px] cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Desc
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">
                    No keywords match your search parameters. Try adjusting the query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1 border-t border-zinc-900">
            <span className="text-zinc-500 text-xs">
              Page <strong className="text-zinc-300">{kwPage + 1}</strong> of <strong className="text-zinc-300">{totalPages}</strong>
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={kwPage === 0}
                onClick={() => setKwPage(p => Math.max(0, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:hover:bg-zinc-900 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={kwPage >= totalPages - 1}
                onClick={() => setKwPage(p => Math.min(totalPages - 1, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:hover:bg-zinc-900 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Google AdSense Compliant Informational Article & FAQs Footer */}
      <div className="border-t border-zinc-900 pt-12 mt-12 space-y-10 text-left max-w-5xl mx-auto px-4">
        
        {/* Editorial Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>SEO Best Practices: Click-Through Rate (CTR) & Search Layouts</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight sm:text-2xl">
            Maximizing Organic Click-Through Rates (CTR) & Optimizing Search Snippets (SERP)
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Writing meta titles and descriptions isn't just about packing keywords. It's about psychology, pixel counts, and rich schema indicators. Learn how configuring compliant meta snippets helps you achieve Google AdSense approval and rank in top spots.
          </p>
        </div>

        {/* 2-Column Article Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Article Column 1 */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-red-500 font-mono">01.</span>
                What is a SERP Snippet Previewer?
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                A **SERP (Search Engine Results Page) Snippet Previewer** is an essential visual sandbox that mimics Google's exact layout engine, allowing you to preview how your page's title, URL, and meta description will appear on desktop and mobile viewports.
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Google doesn't measure snippets by character count alone; it uses precise pixel widths (typically 600px for titles and 960px for descriptions). Going over these thresholds results in truncated text (`...`), lowering your CTR.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-red-500 font-mono">02.</span>
                Importance of Rich Snippets and Schema Markup
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Standard text snippets can look bland. Integrating rich schema structures (like review stars, FAQ dropdowns, breadcrumb links, and publication dates) expands your visual footprint on Google:
              </p>
              <ul className="space-y-2 text-zinc-400 text-xs pl-4 list-disc">
                <li><strong className="text-zinc-200">Star Ratings:</strong> Establishes trust immediately, showing review scores and user consensus directly.</li>
                <li><strong className="text-zinc-200">Sitelinks:</strong> Provides shortcuts to secondary pages, increasing total site real estate.</li>
                <li><strong className="text-zinc-200">FAQ Dropdowns:</strong> Captures prominent real estate by answering common user questions right inside search results.</li>
              </ul>
            </div>
          </div>

          {/* Article Column 2 */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-red-500 font-mono">03.</span>
                How Search Engine Snippets Affect AdSense Approvals
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                When Google reviews websites for the AdSense program, they evaluate if your page represents a credible and professionally configured domain. Having unoptimized, automated, or overlapping meta-tags suggests a lack of attention to site structure.
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                By carefully structuring your meta-tags and previewing them across mobile and desktop devices, you pass automated validation tests with ease, verifying compliance with Google's strict publisher guidelines.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-red-500 font-mono">04.</span>
                Advanced Strategies for CTR Optimization
              </h4>
              <ol className="space-y-1.5 text-zinc-400 text-xs pl-4 list-decimal">
                <li>Keep titles between 50 and 60 characters to avoid truncation.</li>
                <li>Write compelling meta descriptions (120 to 155 characters) that end with a strong Call-To-Action (CTA).</li>
                <li>Always place your primary keyword at the very beginning of the title tag.</li>
                <li>Test mobile-responsiveness: Google prioritizes mobile indexing, so your snippet must look perfect on smartphone preview toggles.</li>
                <li>Analyze related LSI keywords using our interactive target database to seed matching synonyms into your snippet copy.</li>
              </ol>
            </div>
          </div>

        </div>

        {/* Separator */}
        <div className="border-t border-zinc-900/60" />

        {/* FAQ Section */}
        <div className="space-y-6">
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-white tracking-tight">Frequently Asked Questions (FAQ)</h4>
            <p className="text-zinc-500 text-xs">Got questions about Google pixel widths, meta-tag updates, and snippet styling? Read on.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-red-400 shrink-0" />
                What is the maximum pixel width for Google title tags?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                On desktop viewports, Google displays title tags up to 600 pixels wide before truncating them. This translates to roughly 60 characters, although wider characters like "W" or "M" consume more pixel space than "i" or "l."
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-red-400 shrink-0" />
                Does Google always use the meta description I write?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                No, Google dynamically rewrites meta descriptions in up to 70% of searches if they determine that a different excerpt from your page's body text matches the user's specific query more accurately.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-red-400 shrink-0" />
                How often does Google update search snippets in indexation?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Once you change your meta tags, Google will update the search snippet as soon as Googlebot recrawls and reindexes the page. This typically takes anywhere from a few hours to several days depending on crawl frequency.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-red-400 shrink-0" />
                Are meta keywords still relevant for search rankings?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                No. Google officially announced in 2009 that they completely ignore the `meta keywords` HTML tag. Focusing on rich headings, organic search intents, and compelling title tags is a far superior ranking methodology.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
