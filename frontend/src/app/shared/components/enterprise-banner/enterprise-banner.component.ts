import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  Input,
  OnInit,
} from '@angular/core';
import { BannersService } from 'core-app/core/enterprise/banners.service';
import { I18nService } from 'core-app/core/i18n/i18n.service';
import { imagePath } from 'core-app/shared/helpers/images/path-helper';
import { DatasetInputs } from 'core-app/shared/components/dataset-inputs.decorator';
import { OpModalService } from '../modal/modal.service';
import { PathHelperService } from 'core-app/core/path-helper/path-helper.service';

export const enterpriseBannerSelector = 'op-enterprise-banner';

@DatasetInputs
@Component({
  selector: enterpriseBannerSelector,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./enterprise-banner.component.sass'],
  templateUrl: './enterprise-banner.component.html',
})
export class EnterpriseBannerComponent implements OnInit {
  @Input() public leftMargin = false;

  @Input() public textMessage:string;

  @Input() public linkMessage:string;

  @Input() public opReferrer:string;

  @Input() public moreInfoText:string;

  @Input() public moreInfoLink:string;

  @Input() public messageIsHtml = false;

  public link:string;

  public text = {
    enterpriseFeature: this.I18n.t('js.upsale.ee_only'),
    become_hero: this.I18n.t('js.admin.enterprise.upsale.become_hero'),
    you_contribute: this.I18n.t('js.admin.enterprise.upsale.you_contribute'),
    button_trial: this.I18n.t('js.admin.enterprise.upsale.button_start_trial'),
    upgrade: this.I18n.t('js.admin.enterprise.upsale.button_upgrade'),
    more_info_link: `${this.pathHelper.appBasePath}/admin/enterprise`,
  };

  image = {
    enterprise_edition: imagePath('enterprise_edition.png'),
  };

  constructor(
    readonly elementRef:ElementRef,
    protected I18n:I18nService,
    protected bannersService:BannersService,
    protected opModalService:OpModalService,
    readonly injector:Injector,
    readonly pathHelper:PathHelperService,
  ) {}

  ngOnInit():void {
    this.link = this.bannersService.getEnterPriseEditionUrl({ referrer: this.opReferrer });
  }
}
